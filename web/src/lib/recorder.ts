import { createPublicClient, createWalletClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { receiptsAbi } from "./abi";
import {
  chainFor,
  chainIdFromEnv,
  explorerFor,
  receiptsAddress,
  rpcFor,
} from "./chains";

export type RecordResult =
  | { ok: true; skipped?: false; txHash: Hex; explorer: string }
  | { ok: true; skipped: true; txHash?: undefined; explorer?: undefined }
  | { ok: false; error: string };

export async function readReceipt(id: Hex): Promise<{
  payer: Address;
  payee: Address;
  amount: bigint;
  contentHash: Hex;
  paidAt: bigint;
} | null> {
  const address = receiptsAddress();
  if (!address) return null;
  const chainId = chainIdFromEnv();
  const client = createPublicClient({
    chain: chainFor(chainId),
    transport: http(rpcFor(chainId)),
  });
  const row = await client.readContract({
    address,
    abi: receiptsAbi,
    functionName: "receipts",
    args: [id],
  });
  if (row[4] === 0n) return null;
  return {
    payer: row[0],
    payee: row[1],
    amount: row[2],
    contentHash: row[3],
    paidAt: row[4],
  };
}

export async function recordReceipt(args: {
  invoiceId: Hex;
  payer: Address;
  payee: Address;
  amount: bigint;
  contentHash: Hex;
}): Promise<RecordResult> {
  const address = receiptsAddress();
  const key = process.env.RECORDER_PRIVATE_KEY;
  if (!address || !key) {
    return { ok: true, skipped: true };
  }
  try {
    const account = privateKeyToAccount(normalizeKey(key));
    const chainId = chainIdFromEnv();
    const chain = chainFor(chainId);
    const transport = http(rpcFor(chainId));
    const publicClient = createPublicClient({ chain, transport });
    const wallet = createWalletClient({ account, chain, transport });
    const hash = await wallet.writeContract({
      address,
      abi: receiptsAbi,
      functionName: "record",
      args: [args.invoiceId, args.payer, args.payee, args.amount, args.contentHash],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return { ok: true, txHash: hash, explorer: `${explorerFor(chainId)}/tx/${hash}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not write the receipt." };
  }
}

function normalizeKey(key: string): Hex {
  return (key.startsWith("0x") ? key : `0x${key}`) as Hex;
}
