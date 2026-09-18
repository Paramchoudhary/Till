import type { ReactNode } from "react";
import { addressUrl, chainIdFromEnv } from "@/lib/chains";
import { formatUsdc } from "@/lib/invoice";
import { shortAddress } from "@/lib/format";
import type { Invoice } from "@/lib/invoice";

export function InvoiceSheet({
  invoice,
  children,
}: {
  invoice: Invoice;
  children?: ReactNode;
}) {
  const chainId = chainIdFromEnv();
  return (
    <article className="paper mx-auto w-full max-w-lg rounded-sm px-8 py-10 sm:px-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-paper-ink/50">Invoice</p>
      <p className="mt-6 font-mono text-5xl font-semibold tnum">
        {formatUsdc(invoice.amount)}
        <span className="ml-2 text-lg font-medium text-paper-ink/45">USDC</span>
      </p>
      <dl className="mt-8 space-y-3 text-sm">
        <div className="flex justify-between gap-6 border-t border-paper-ink/10 pt-3">
          <dt className="text-paper-ink/50">Pay to</dt>
          <dd>
            <a className="font-mono hover:underline" href={addressUrl(chainId, invoice.payee)}>
              {shortAddress(invoice.payee)}
            </a>
          </dd>
        </div>
        <div className="flex justify-between gap-6 border-t border-paper-ink/10 pt-3">
          <dt className="text-paper-ink/50">Memo</dt>
          <dd className="text-right">{invoice.memo}</dd>
        </div>
      </dl>
      {children ? <div className="mt-8">{children}</div> : null}
    </article>
  );
}
