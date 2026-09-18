import { createPublicClient, http, type Address, type Hex } from "viem";
import { receiptsAbi } from "./abi";
import { addressUrl, chainFor, chainIdFromEnv, receiptsAddress, rpcFor } from "./chains";
import { demoInvoice, invoiceId } from "./invoice";

/// Server-side reads of what Arc actually holds.
///
/// The home page claims a receipt is final and on chain. That claim is worth nothing if the page is
/// showing hardcoded numbers, so it reads the real thing instead: the receipt struct for the demo
/// invoice, straight out of contract storage.
///
/// Storage rather than event logs on purpose. Arc's public RPCs prune history -- `eth_getLogs` from
/// block 0 answers `pruned history unavailable` -- so any design that needs a log scan breaks a few
/// weeks after deploy. A keyed storage read is O(1) and always available.

export type OnchainReceipt = {
  invoiceId: Hex;
  payer: Address;
  payee: Address;
  amount: bigint;
  paidAt: number;
  /// The Receipts contract on ArcScan, which is where this receipt is readable by anyone.
  contractUrl: string;
  contract: Address;
};

function client() {
  const chainId = chainIdFromEnv();
  return createPublicClient({ chain: chainFor(chainId), transport: http(rpcFor(chainId)) });
}

/// The demo invoice's receipt, or null if it has not been paid yet or the RPC is unreachable.
///
/// Never throws. A flaky public RPC must not be able to take down the landing page — the page falls
/// back to showing the invoice as payable, which is also true.
export async function demoReceipt(): Promise<OnchainReceipt | null> {
  const address = receiptsAddress();
  if (!address) return null;

  const id = invoiceId(demoInvoice());

  try {
    const [payer, payee, amount, , paidAt] = await client().readContract({
      address,
      abi: receiptsAbi,
      functionName: "receipts",
      args: [id],
    });

    if (paidAt === 0n || payer === "0x0000000000000000000000000000000000000000") return null;

    return {
      invoiceId: id,
      payer,
      payee,
      amount,
      paidAt: Number(paidAt),
      contract: address,
      contractUrl: addressUrl(chainIdFromEnv(), address),
    };
  } catch {
    return null;
  }
}

/// Current block height, used as a liveness tell in the header. Null when unreachable.
export async function blockHeight(): Promise<number | null> {
  try {
    return Number(await client().getBlockNumber());
  } catch {
    return null;
  }
}
