"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddress } from "@/lib/format";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted hover:border-accent hover:text-foreground"
      >
        {shortAddress(address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!injected || isPending}
      onClick={() => injected && connect({ connector: injected })}
      className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg disabled:opacity-40"
    >
      {isPending ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
