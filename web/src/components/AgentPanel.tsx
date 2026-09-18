"use client";

import { useSyncExternalStore } from "react";
import { chainLabel } from "@/lib/invoice";
import { siteUrl } from "@/lib/chains";

function subscribe() {
  return () => {};
}

function clientOrigin() {
  return window.location.origin;
}

function serverOrigin() {
  return siteUrl().replace(/\/$/, "");
}

export function AgentPanel({ invoicePath }: { invoicePath: string }) {
  const origin = useSyncExternalStore(subscribe, clientOrigin, serverOrigin);
  const url = `${origin}${invoicePath}`;
  const curl = `curl -i ${url}`;
  const pay = `node scripts/pay.mjs ${url}`;
  const mcp = `{
  "name": "pay_invoice",
  "description": "Pay a Till invoice in USDC on Arc. HTTP 402, no API key.",
  "inputSchema": {
    "type": "object",
    "required": ["url"],
    "properties": { "url": { "type": "string" } }
  }
}`;

  return (
    <section className="mx-auto mt-10 w-full max-w-lg space-y-4 text-sm">
      <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-dim">Agent path · no API key</h2>
      <p className="text-muted">
        The same invoice is an x402 resource on {chainLabel()}. A client that can settle USDC through
        Circle Gateway pays the <code className="font-mono text-foreground">402</code> and receives the
        receipt.
      </p>
      <Code label="Probe">{curl}</Code>
      <Code label="Pay">{pay}</Code>
      <Code label="MCP tool">{mcp}</Code>
    </section>
  );
}

function Code({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-dim">{label}</p>
      <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-3 font-mono text-[12px] leading-5 text-foreground">
        {children}
      </pre>
    </div>
  );
}
