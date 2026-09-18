import { tryInvoice } from "@/lib/format";
import { corsHeaders, paymentHeader, paymentRequiredResponse, settleAndFulfill } from "@/lib/x402";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const decoded = tryInvoice(id);
  if ("error" in decoded) {
    return Response.json({ error: decoded.error }, { status: 404, headers: corsHeaders() });
  }

  const signature = paymentHeader(request);
  const url = new URL(request.url).pathname;
  if (!signature) return paymentRequiredResponse(decoded.invoice, url);
  return settleAndFulfill({ invoice: decoded.invoice, url, paymentHeader: signature });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return GET(request, context);
}
