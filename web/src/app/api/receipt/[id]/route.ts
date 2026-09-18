import { corsHeaders } from "@/lib/x402";
import { formatUsdc } from "@/lib/invoice";
import { readReceipt } from "@/lib/recorder";
import { isHex, type Hex } from "viem";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isHex(id) || id.length !== 66) {
    return Response.json({ error: "Receipt id must be a 32-byte hex hash." }, { status: 400, headers: corsHeaders() });
  }
  const row = await readReceipt(id as Hex);
  if (!row) {
    return Response.json({ paid: false }, { status: 200, headers: corsHeaders() });
  }
  return Response.json(
    {
      paid: true,
      payer: row.payer,
      payee: row.payee,
      amount: row.amount.toString(),
      formatted: `${formatUsdc(row.amount)} USDC`,
      contentHash: row.contentHash,
      paidAt: Number(row.paidAt),
    },
    { headers: corsHeaders() },
  );
}
