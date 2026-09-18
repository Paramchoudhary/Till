"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { createInvoice, encodeInvoice } from "@/lib/invoice";

export default function NewInvoicePage() {
  const router = useRouter();
  const { address } = useAccount();
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("0.05");
  const [memo, setMemo] = useState("Till invoice");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const to = payee || address;
    if (!to || !isAddress(to)) {
      setError("Payee must be an Arc address.");
      return;
    }
    try {
      const invoice = createInvoice({ payee: to, amountUsdc: amount, memo });
      router.push(`/i/${encodeInvoice(invoice)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the invoice.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-8 max-w-md space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
      <label className="block text-sm">
        <span className="text-muted">Amount (USDC)</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Memo</span>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={280}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Pay to {address ? "(blank = your wallet)" : ""}</span>
        <input
          value={payee}
          onChange={(e) => setPayee(e.target.value)}
          placeholder={address ?? "0x…"}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm"
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg"
      >
        Create payable link
      </button>
    </form>
  );
}
