import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import {
  caip2,
  chainIdFromEnv,
  FACILITATOR_URL,
  GATEWAY_WALLET,
  MAX_TIMEOUT_SECONDS,
  USDC,
} from "./chains";
import { contentHash, formatUsdc, invoiceId, type Invoice } from "./invoice";
import { recordReceipt } from "./recorder";

export type PaymentRequired = {
  x402Version: 2;
  resource: { url: string; description: string; mimeType: "application/json" };
  accepts: PaymentRequirements[];
};

export type PaymentRequirements = {
  scheme: "exact";
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: {
    name: "GatewayWalletBatched";
    version: "1";
    verifyingContract: string;
  };
};

export type PaymentPayload = {
  x402Version: number;
  payload: Record<string, unknown>;
  accepted?: PaymentRequirements;
  resource?: PaymentRequired["resource"];
};

function facilitatorUrl(): string {
  return process.env.FACILITATOR_URL ?? FACILITATOR_URL[chainIdFromEnv()];
}

export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Payment-Signature, PAYMENT-SIGNATURE, Content-Type",
    "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE",
  };
}

export function paymentHeader(request: Request): string | null {
  return request.headers.get("payment-signature") ?? request.headers.get("x-payment");
}

export function requirementsFor(invoice: Invoice): PaymentRequirements {
  const chainId = chainIdFromEnv();
  return {
    scheme: "exact",
    network: caip2(chainId),
    asset: USDC,
    amount: invoice.amount,
    payTo: invoice.payee,
    maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
    extra: {
      name: "GatewayWalletBatched",
      version: "1",
      verifyingContract: GATEWAY_WALLET[chainId],
    },
  };
}

export function paymentRequiredBody(invoice: Invoice, url: string): PaymentRequired {
  return {
    x402Version: 2,
    resource: {
      url,
      description: `${formatUsdc(invoice.amount)} USDC invoice: ${invoice.memo}`,
      mimeType: "application/json",
    },
    accepts: [requirementsFor(invoice)],
  };
}

export function encodeHeader(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}

export function paymentRequiredResponse(invoice: Invoice, url: string): Response {
  const body = paymentRequiredBody(invoice, url);
  return new Response("{}", {
    status: 402,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json",
      "PAYMENT-REQUIRED": encodeHeader(body),
    },
  });
}

export async function settleAndFulfill(args: {
  invoice: Invoice;
  url: string;
  paymentHeader: string;
}): Promise<Response> {
  const requirements = requirementsFor(args.invoice);
  let payload: PaymentPayload;
  try {
    payload = JSON.parse(Buffer.from(args.paymentHeader, "base64").toString("utf8")) as PaymentPayload;
  } catch {
    return jsonError(400, "Payment signature is not valid base64 JSON.");
  }

  const accepted = payload.accepted ?? requirements;
  if (accepted.network !== requirements.network || accepted.payTo.toLowerCase() !== requirements.payTo.toLowerCase()) {
    return jsonError(400, "Payment was signed for a different invoice.");
  }

  const facilitator = new BatchFacilitatorClient({ url: facilitatorUrl() });
  const settlement = await facilitator.settle(payload, accepted);
  if (!settlement.success) {
    return jsonError(402, settlement.errorReason ?? "Settlement failed.");
  }

  const payer = (settlement.payer ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
  const id = invoiceId(args.invoice);
  const recorded = await recordReceipt({
    invoiceId: id,
    payer,
    payee: args.invoice.payee,
    amount: BigInt(args.invoice.amount),
    contentHash: contentHash(args.invoice),
  });

  const settleResponse = {
    success: true,
    transaction: settlement.transaction,
    network: settlement.network,
    payer,
  };

  return Response.json(
    {
      ok: true,
      invoice: args.invoice,
      receipt: {
        invoiceId: id,
        payer,
        payee: args.invoice.payee,
        amount: args.invoice.amount,
        formatted: `${formatUsdc(args.invoice.amount)} USDC`,
        facilitatorTx: settlement.transaction,
        recordTx: recorded.ok && "txHash" in recorded ? recorded.txHash : null,
        explorer: recorded.ok && "explorer" in recorded ? recorded.explorer : null,
        recorded: recorded.ok && !("skipped" in recorded && recorded.skipped),
        recordError: recorded.ok ? null : recorded.error,
      },
    },
    {
      status: 200,
      headers: {
        ...corsHeaders(),
        "PAYMENT-RESPONSE": encodeHeader(settleResponse),
      },
    },
  );
}

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: corsHeaders() });
}
