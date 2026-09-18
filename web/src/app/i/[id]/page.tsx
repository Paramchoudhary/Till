import { AgentPanel } from "@/components/AgentPanel";
import { InvoiceSheet } from "@/components/InvoiceSheet";
import { PayButton } from "@/components/PayButton";
import { tryInvoice } from "@/lib/format";
import { invoiceId } from "@/lib/invoice";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decoded = tryInvoice(id);
  if ("error" in decoded) {
    return (
      <div className="mx-auto mt-16 max-w-md text-center">
        <h1 className="text-xl font-semibold">Invoice not found</h1>
        <p className="mt-2 text-sm text-muted">{decoded.error}</p>
      </div>
    );
  }

  const { invoice } = decoded;
  return (
    <div className="pt-4">
      <InvoiceSheet invoice={invoice}>
        <PayButton invoice={invoice} />
      </InvoiceSheet>
      <p className="mx-auto mt-4 max-w-lg text-center font-mono text-[11px] text-dim">
        {invoiceId(invoice)}
      </p>
      <AgentPanel invoicePath={`/api/i/${id}`} />
    </div>
  );
}
