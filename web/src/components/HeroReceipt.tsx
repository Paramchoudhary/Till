import { shortAddress } from "@/lib/format";
import { formatUsdc, type Invoice } from "@/lib/invoice";
import type { OnchainReceipt } from "@/lib/onchain";

/// The product's one physical object: a till roll with a stamp on it.
///
/// This is the hero image, and it is built from data rather than drawn. When the demo invoice has been
/// paid, the receipt fields are read from Arc and the sheet gets stamped; when it has not, the same
/// sheet renders unstamped and payable. So the picture cannot drift from the truth — there is no
/// screenshot to go stale.

export function HeroReceipt({ invoice, receipt }: { invoice: Invoice; receipt: OnchainReceipt | null }) {
  const paid = receipt !== null;

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* the sheet */}
      {/* `overflow-hidden` is not decoration. The stamp animates in from scale(2.4) with a delay and
          `both` fill, so before it plays it holds that start frame -- invisible, but occupying a box
          wide enough to widen the document and give the whole page a horizontal scrollbar on a phone
          for the first second. Clipping at the paper edge contains it, and a stamp cropped by the
          edge of the paper is what a real one looks like anyway. */}
      <article className="paper perf-top perf-bottom relative overflow-hidden rounded-sm px-7 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-paper-ink/45">
              Till · invoice
            </p>
            <p className="mt-3 font-mono text-4xl font-semibold tnum">
              {formatUsdc(invoice.amount)}
              <span className="ml-1.5 text-base font-medium text-paper-ink/45">USDC</span>
            </p>
          </div>
          {paid ? (
            <span className="mt-1 rounded-full bg-paper-ink/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper-ink/60">
              settled
            </span>
          ) : null}
        </div>

        <dl className="mt-6 space-y-2.5 font-mono text-[12px]">
          <Line k="memo" v={invoice.memo} wrap />
          <Line k="pay to" v={shortAddress(invoice.payee)} />
          {receipt ? (
            <>
              <Line k="payer" v={shortAddress(receipt.payer)} />
              <Line k="paid at" v={new Date(receipt.paidAt * 1000).toISOString().replace("T", " ").slice(0, 19)} />
            </>
          ) : (
            <Line k="status" v="awaiting payment" />
          )}
        </dl>

        {/* Room left deliberately below the ledger so the stamp lands on blank paper rather than
            over the numbers. A stamp that hides the data it certifies is a worse picture. */}
        <div className="mt-6 border-t border-dashed border-paper-ink/20 pt-3 pb-10">
          <p className="font-mono text-[10px] leading-4 text-paper-ink/45">
            {paid
              ? "recorded on arc · immutable · anyone can verify"
              : "payable by wallet or agent over http 402"}
          </p>
        </div>

        {paid ? (
          <div className="stamp pointer-events-none absolute bottom-4 right-4 select-none">
            <div className="rounded-md border-[3px] border-[#b4472f]/70 px-3 py-1.5">
              <span className="font-mono text-2xl font-black tracking-[0.14em] text-[#b4472f]/75">PAID</span>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}

function Line({ k, v, wrap }: { k: string; v: string; wrap?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-t border-paper-ink/10 pt-2.5">
      <dt className="shrink-0 text-paper-ink/45">{k}</dt>
      <dd className={`text-right ${wrap ? "" : "truncate"}`}>{v}</dd>
    </div>
  );
}
