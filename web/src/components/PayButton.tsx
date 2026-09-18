"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { receiptsAbi, usdcAbi } from "@/lib/abi";
import { USDC, chainIdFromEnv, receiptsAddress } from "@/lib/chains";
import { contentHash, invoiceId, type Invoice } from "@/lib/invoice";
import { wagmiConfig } from "@/lib/wagmi";
import { WalletButton } from "./WalletButton";

export function PayButton({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const chainId = chainIdFromEnv();
  const receipts = receiptsAddress();
  const { address, isConnected, chainId: walletChain } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();
  const id = invoiceId(invoice);
  const amount = BigInt(invoice.amount);
  const hash = contentHash(invoice);
  const [stepError, setStepError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const { data: paid } = useReadContract({
    address: receipts ?? undefined,
    abi: receiptsAbi,
    functionName: "paid",
    args: [id],
    query: { enabled: Boolean(receipts), refetchInterval: 4_000 },
  });

  const { data: allowance } = useReadContract({
    address: USDC,
    abi: usdcAbi,
    functionName: "allowance",
    args: address && receipts ? [address, receipts] : undefined,
    query: { enabled: Boolean(address && receipts) },
  });

  const { data: balance } = useReadContract({
    address: USDC,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const write = useWriteContract();

  if (paid) {
    return (
      <a
        href={`/r/${id}`}
        className="block rounded-full bg-paper-ink px-4 py-3 text-center text-sm font-semibold text-paper"
      >
        Paid — open receipt
      </a>
    );
  }

  if (!receipts) {
    return (
      <p className="text-sm text-paper-ink/70">
        Wallet pay needs <code className="font-mono">NEXT_PUBLIC_RECEIPTS_ADDRESS</code>. Agents can
        still pay the x402 endpoint below.
      </p>
    );
  }

  const receiptsAddr = receipts;

  if (!isConnected) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-paper-ink/70">Connect a wallet on Arc to pay.</p>
        <WalletButton />
      </div>
    );
  }

  if (walletChain !== chainId) {
    return (
      <button
        type="button"
        disabled={switching}
        onClick={() => switchChain({ chainId })}
        className="w-full rounded-full bg-paper-ink px-4 py-3 text-sm font-semibold text-paper disabled:opacity-50"
      >
        {switching ? "Switching…" : "Switch to Arc"}
      </button>
    );
  }

  const needsApprove = (allowance ?? 0n) < amount;
  const tooPoor = (balance ?? 0n) < amount;
  const busy = write.isPending || waiting;
  const err = stepError ?? write.error?.message;

  async function onPay() {
    setStepError(null);
    setWaiting(true);
    try {
      if (needsApprove) {
        const approval = await write.writeContractAsync({
          address: USDC,
          abi: usdcAbi,
          functionName: "approve",
          args: [receiptsAddr, amount],
        });
        await waitForTransactionReceipt(wagmiConfig, { hash: approval });
      }
      const tx = await write.writeContractAsync({
        address: receiptsAddr,
        abi: receiptsAbi,
        functionName: "pay",
        args: [id, invoice.payee, amount, hash],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: tx });
      router.push(`/r/${id}?tx=${tx}`);
    } catch (error) {
      setStepError(error instanceof Error ? error.message : "Payment failed.");
    } finally {
      setWaiting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy || tooPoor}
        onClick={() => void onPay()}
        className="w-full rounded-full bg-paper-ink px-4 py-3 text-sm font-semibold text-paper disabled:opacity-50"
      >
        {busy ? "Paying…" : tooPoor ? "Not enough USDC" : needsApprove ? "Approve and pay" : "Pay invoice"}
      </button>
      {err ? <p className="text-xs text-red-700">{err}</p> : null}
    </div>
  );
}
