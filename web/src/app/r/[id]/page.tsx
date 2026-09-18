import { addressUrl, chainIdFromEnv, explorerFor, receiptsAddress, txUrl } from "@/lib/chains";
import { formatUsdc } from "@/lib/invoice";
import { readReceipt } from "@/lib/recorder";
import { isHex, type Hex } from "viem";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tx?: string }>;
}) {
  const { id } = await params;
  const { tx } = await searchParams;
  const chainId = chainIdFromEnv();
  if (!isHex(id) || id.length !== 66) {
    return (
      <div className="mx-auto mt-16 max-w-md text-center">
        <h1 className="text-xl font-semibold">Receipt not found</h1>
        <p className="mt-2 text-sm text-muted">A receipt id is a 32-byte hex hash.</p>
      </div>
    );
  }

  const row = await readReceipt(id as Hex);
  if (!row && !tx) {
    return (
      <div className="mx-auto mt-16 max-w-md text-center">
        <h1 className="text-xl font-semibold">Not paid yet</h1>
        <p className="mt-2 text-sm text-muted">
          {receiptsAddress()
            ? "No receipt is on Arc for this invoice."
            : "Receipts contract is not configured, so there is nothing to read on-chain."}
        </p>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <article className="paper mx-auto w-full max-w-lg rounded-sm px-8 py-10 sm:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-paper-ink/50">Receipt</p>
        <p className="mt-3 text-sm font-medium text-green-800">Paid on Arc</p>
        {row ? (
          <>
            <p className="mt-6 font-mono text-5xl font-semibold tracking-tight tnum">
              {formatUsdc(row.amount)}
              <span className="ml-2 text-lg font-medium text-paper-ink/45">USDC</span>
            </p>
            <dl className="mt-8 space-y-3 text-sm">
              <Row label="Payer" href={addressUrl(chainId, row.payer)} value={row.payer} />
              <Row label="Payee" href={addressUrl(chainId, row.payee)} value={row.payee} />
              <Row
                label="Paid at"
                value={new Date(Number(row.paidAt) * 1000).toISOString().replace(".000", "")}
              />
            </dl>
          </>
        ) : (
          <p className="mt-6 text-sm">Payment submitted. Waiting for the on-chain receipt to land.</p>
        )}
        {tx && isHex(tx) ? (
          <a className="mt-6 inline-block text-sm underline" href={txUrl(chainId, tx)}>
            View transaction
          </a>
        ) : null}
        <a
          className="mt-4 block text-sm text-paper-ink/50 hover:underline"
          href={`${explorerFor(chainId)}`}
        >
          Open explorer
        </a>
      </article>
    </div>
  );
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = <span className="break-all font-mono text-xs">{value}</span>;
  return (
    <div className="flex justify-between gap-6 border-t border-paper-ink/10 pt-3">
      <dt className="text-paper-ink/50">{label}</dt>
      <dd>{href ? <a href={href}>{body}</a> : body}</dd>
    </div>
  );
}
