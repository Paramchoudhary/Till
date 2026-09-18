import Link from "next/link";
import { HeroReceipt } from "@/components/HeroReceipt";
import { WireDemo } from "@/components/WireDemo";
import { AgentPanel } from "@/components/AgentPanel";
import { addressUrl, chainIdFromEnv, receiptsAddress, siteUrl } from "@/lib/chains";
import { shortAddress } from "@/lib/format";
import { chainLabel, demoInvoice, formatUsdc } from "@/lib/invoice";
import { blockHeight, demoReceipt } from "@/lib/onchain";

/// Re-read the chain every half minute. Fresh enough that the block height is a real liveness tell,
/// slow enough that a judge refreshing the page does not hammer a public RPC.
export const revalidate = 30;

export default async function Home() {
  const invoice = demoInvoice();
  const chainId = chainIdFromEnv();

  // Both are allowed to fail; the page degrades to the unpaid state rather than erroring.
  const [receipt, height] = await Promise.all([demoReceipt(), blockHeight()]);
  const receipts = receiptsAddress();

  return (
    <div className="relative">
      {/* ------------------------------------------------------------------ hero */}
      <div className="grid-bg pointer-events-none absolute inset-x-0 -top-16 h-[520px]" />

      <section className="relative grid items-center gap-10 pt-10 sm:pt-14 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip>
              <span className="h-1.5 w-1.5 rounded-full bg-accent pulse-dot" />
              {chainLabel()}
              {height !== null ? <span className="tnum text-dim">#{height.toLocaleString()}</span> : null}
            </Chip>
            <Chip>USDC is gas</Chip>
            <Chip>HTTP 402</Chip>
            <Chip>no API key</Chip>
          </div>

          <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Invoices that
            <br />
            <span className="text-accent">agents can pay.</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-muted">
            A human creates an invoice. A machine hits the URL, gets an HTTP{" "}
            <span className="font-mono text-warn">402</span>, signs {formatUsdc(invoice.amount)} USDC, and
            retries. Circle&apos;s x402 facilitator settles on {chainLabel()} and the receipt is written
            on-chain. No key, no account, no checkout page.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/i/demo"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition hover:brightness-110"
            >
              Pay the demo invoice
            </Link>
            <Link
              href="/new"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:border-accent"
            >
              Create an invoice
            </Link>
          </div>

          <p className="mt-5 font-mono text-[11.5px] text-dim">
            or, from a terminal:{" "}
            <span className="text-muted">curl -i {siteUrl().replace(/\/$/, "")}/api/i/demo</span>
          </p>
        </div>

        <HeroReceipt invoice={invoice} receipt={receipt} />
      </section>

      {/* ------------------------------------------------------- the live protocol */}
      <section className="mt-16">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">The handshake, running now</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              This is not a recording. Your browser just called the same endpoint an agent calls, and
              this is what came back — the challenge, and the payment terms decoded out of it.
            </p>
          </div>
        </div>
        <WireDemo path="/api/i/demo" />
      </section>

      {/* ------------------------------------------------------------ the receipt */}
      <section className="mt-16">
        <h2 className="text-lg font-semibold tracking-tight">And the receipt is already on Arc</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          {receipt
            ? "Read live from contract storage, not from our database. Anyone can check it."
            : "The demo invoice has not been paid yet. Pay it and this fills in from chain state."}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {receipt ? (
            <>
              <Fact k="amount" v={`${formatUsdc(receipt.amount)} USDC`} accent />
              <Fact k="payer" v={shortAddress(receipt.payer)} href={addressUrl(chainId, receipt.payer)} />
              <Fact k="payee" v={shortAddress(receipt.payee)} href={addressUrl(chainId, receipt.payee)} />
              <Fact
                k="paid at"
                v={new Date(receipt.paidAt * 1000).toISOString().replace("T", " ").slice(0, 19) + "Z"}
              />
              <div className="sm:col-span-2 lg:col-span-4">
                <Fact k="invoice id" v={receipt.invoiceId} mono />
              </div>
            </>
          ) : (
            <>
              <Fact k="amount" v={`${formatUsdc(invoice.amount)} USDC`} accent />
              <Fact k="status" v="unpaid" />
              <Fact k="payee" v={shortAddress(invoice.payee)} href={addressUrl(chainId, invoice.payee)} />
              <Fact k="chain" v={chainLabel()} />
            </>
          )}
        </div>

        {receipts ? (
          <p className="mt-3 font-mono text-[11.5px] text-dim">
            Receipts contract{" "}
            <a
              href={addressUrl(chainId, receipts)}
              target="_blank"
              rel="noreferrer"
              className="text-muted hover:text-accent hover:underline"
            >
              {receipts}
            </a>
          </p>
        ) : null}
      </section>

      {/* -------------------------------------------------------------- why arc */}
      <section className="mt-16">
        <h2 className="text-lg font-semibold tracking-tight">Why this needs Arc</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Why title="A $0.05 invoice is $0.05">
            Gas is USDC, not a volatile third token. Machine payments this small stop making sense the
            moment you have to hold something else to send them.
          </Why>
          <Why title="The facilitator is native">
            Circle&apos;s x402 batching facilitator settles on{" "}
            <span className="font-mono text-muted">eip155:{chainId}</span>. No bridge, no wrapper, no
            second custody step between the agent and the payee.
          </Why>
          <Why title="A receipt that will not reorg">
            Sub-second finality, so the record written after settlement is commercially final by the time
            the HTTP response closes.
          </Why>
        </div>
      </section>

      {/* ---------------------------------------------------------- agent wiring */}
      <section className="mt-16">
        <h2 className="text-lg font-semibold tracking-tight">Wire an agent to it</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          The payable resource is a URL. Anything that speaks HTTP and can settle USDC is a customer —
          no SDK to adopt and nothing to register.
        </p>
        <AgentPanel invoicePath="/api/i/demo" />
      </section>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[11px] tracking-wide text-muted">
      {children}
    </span>
  );
}

function Fact({
  k,
  v,
  href,
  accent,
  mono,
}: {
  k: string;
  v: string;
  href?: string;
  accent?: boolean;
  mono?: boolean;
}) {
  const value = (
    <span className={`${accent ? "text-accent" : "text-foreground"} ${mono ? "break-all" : "truncate"}`}>
      {v}
    </span>
  );
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-dim">{k}</p>
      <p className="tnum mt-1.5 font-mono text-sm">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="hover:text-accent hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function Why({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1.5 text-[13px] leading-6 text-muted">{children}</p>
    </div>
  );
}
