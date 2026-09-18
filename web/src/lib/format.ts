import { decodeInvoice, invoiceConfigured, type Invoice } from "./invoice";

export function tryInvoice(id: string): { invoice: Invoice } | { error: string } {
  try {
    const invoice = decodeInvoice(id);
    if (!invoiceConfigured(invoice)) {
      return { error: "This invoice has no payee. Set NEXT_PUBLIC_DEMO_PAYEE or create a new invoice." };
    }
    return { invoice };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invoice id is not valid." };
  }
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
