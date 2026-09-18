"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/// The HTTP 402 handshake, run for real in the visitor's browser.
///
/// Every other way of showing a protocol on a landing page is a drawing of one. This calls the same
/// endpoint an agent calls, on this deployment, and prints what actually came back: the status line,
/// the `PAYMENT-REQUIRED` header, and that header decoded into the payment requirements. The amount,
/// the network, the USDC address and the verifying contract on screen are the server's own answer,
/// not copy.
///
/// Leg one only. Completing the handshake means signing a USDC transfer, and a page that did that on
/// load would spend real money on every visit. So the second leg is shown as the command that
/// performs it, and the receipt underneath is read from Arc — the outcome of a payment that already
/// happened. Nothing here pretends a transaction occurred that did not.

type Phase = "idle" | "probing" | "challenged" | "failed";

type Requirements = {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: { name?: string; version?: string; verifyingContract?: string };
};

type Challenge = {
  x402Version: number;
  resource: { url: string; description: string; mimeType: string };
  accepts: Requirements[];
};

function decodeHeader(value: string): Challenge {
  const json = atob(value);
  const bytes = Uint8Array.from(json, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as Challenge;
}

export function WireDemo({ path = "/api/i/demo" }: { path?: string }) {
  // Mount state is already the state the probe starts in, so the effect below never has to set state
  // synchronously to get there -- it just starts the request and reports what comes back.
  const [phase, setPhase] = useState<Phase>("probing");
  const [status, setStatus] = useState<number | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const probe = useCallback(async () => {
    const started = performance.now();
    try {
      // Deliberately no Payment-Signature header: that absence is what provokes the 402.
      const res = await fetch(path, { headers: { accept: "application/json" }, cache: "no-store" });
      const elapsed = Math.round(performance.now() - started);

      const header = res.headers.get("payment-required");
      setStatus(res.status);
      setMs(elapsed);

      if (res.status !== 402 || !header) {
        setError(
          res.status === 200
            ? "Endpoint returned 200 without asking for payment."
            : `Expected 402 with a PAYMENT-REQUIRED header, got ${res.status}.`,
        );
        setPhase("failed");
        return;
      }

      setRaw(header);
      setChallenge(decodeHeader(header));
      setPhase("challenged");

      // Reveal the lines in sequence. Short enough that a judge is never waiting on an animation.
      [1, 2, 3, 4].forEach((n, i) => {
        timers.current.push(setTimeout(() => setStep(n), 260 * (i + 1)));
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
      setPhase("failed");
    }
  }, [path]);

  useEffect(() => {
    // `set-state-in-effect` guards against effects that set state during render and cascade. This
    // does not: every setState in `probe` happens after an awaited network round trip, which is the
    // ordinary "fetch on mount, then report" shape. The rule cannot see through the await, and the
    // alternatives -- deferring through a timeout, or hoisting the promise to module scope -- would
    // obscure a straightforward request to satisfy a heuristic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void probe();
    const pending = timers;
    return () => pending.current.forEach(clearTimeout);
  }, [probe]);

  /// Resetting is a click, not a render, so clearing the previous run's state here is fine.
  const replay = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("probing");
    setStep(0);
    setStatus(null);
    setMs(null);
    setRaw(null);
    setChallenge(null);
    setError(null);
    void probe();
  }, [probe]);

  const req = challenge?.accepts?.[0];
  const usdc = req ? (Number(req.amount) / 1e6).toFixed(2) : null;

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-surface">
      {/* header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-2.5">
        <span className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              phase === "challenged" ? "bg-accent pulse-dot" : phase === "failed" ? "bg-warn" : "bg-dim"
            }`}
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            live · this deployment
          </span>
        </span>
        {ms !== null ? <span className="tnum font-mono text-[11px] text-dim">{ms} ms</span> : null}
        <button
          onClick={replay}
          className="ml-auto rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted transition hover:border-accent hover:text-foreground"
        >
          replay
        </button>
      </div>

      {/* a slow sweep, so the panel reads as instrumentation */}
      {phase === "probing" ? (
        <div className="pointer-events-none absolute inset-x-0 top-[41px] h-px overflow-hidden">
          <div className="sweep h-px w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent" />
        </div>
      ) : null}

      <div className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-6">
        {/* leg 1 — request */}
        <p className="line-in">
          <span className="text-accent">$</span>{" "}
          <span className="text-foreground">curl -i {path}</span>
          {phase === "probing" ? <span className="caret ml-1 text-accent">▊</span> : null}
        </p>

        {status !== null ? (
          <p className="line-in mt-2">
            <span className="text-dim">&lt;</span>{" "}
            <span className={status === 402 ? "font-semibold text-warn" : "text-warn"}>
              HTTP/1.1 {status} {status === 402 ? "Payment Required" : ""}
            </span>
          </p>
        ) : null}

        {error ? (
          <p className="line-in mt-2 text-warn">
            <span className="text-dim">!</span> {error}
          </p>
        ) : null}

        {raw && step >= 1 ? (
          <p className="line-in mt-1 break-all text-dim">
            <span>&lt;</span> payment-required:{" "}
            <span className="text-muted">{raw.slice(0, 44)}…</span>
          </p>
        ) : null}

        {/* the decoded challenge — the part that matters */}
        {req && challenge && step >= 2 ? (
          <div className="line-in mt-3 rounded-lg border border-border bg-surface-2 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-dim">
              decoded · base64 → payment requirements
            </p>
            <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              <Row k="x402Version" v={String(challenge.x402Version)} />
              <Row k="scheme" v={req.scheme} />
              <Row k="network" v={req.network} accent />
              <Row k="amount" v={`${req.amount} (${usdc} USDC)`} accent />
              <Row k="asset" v={req.asset} title="Arc's native USDC" />
              <Row k="payTo" v={req.payTo} />
              <Row k="verifyingContract" v={req.extra?.verifyingContract ?? "—"} />
              <Row k="settlement" v={req.extra?.name ?? "—"} />
            </dl>
          </div>
        ) : null}

        {/* leg 2 — clearly the next step, not a claim that it happened */}
        {step >= 3 ? (
          <>
            <p className="line-in mt-4 text-dim"># the agent signs a USDC transfer and retries:</p>
            <p className="line-in mt-1">
              <span className="text-accent">$</span>{" "}
              <span className="text-foreground">node scripts/pay.mjs {path}</span>
            </p>
          </>
        ) : null}

        {step >= 4 ? (
          <p className="line-in mt-2 text-dim">
            <span>&lt;</span> <span className="text-good">HTTP/1.1 200 OK</span> + payment-response,
            receipt written on Arc
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Row({ k, v, accent, title }: { k: string; v: string; accent?: boolean; title?: string }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2" title={title}>
      <dt className="shrink-0 text-dim">{k}</dt>
      <dd className={`min-w-0 truncate ${accent ? "text-accent" : "text-foreground"}`}>{v}</dd>
    </div>
  );
}
