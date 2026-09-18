import { keccak256, toBytes, type Address, type Hex, isAddress } from "viem";
import { chainIdFromEnv } from "./chains";

export type Invoice = {
  v: 1;
  payee: Address;
  /** Atomic USDC (6 decimals). */
  amount: string;
  memo: string;
  salt: string;
};

export const DEMO_AMOUNT = "50000"; // 0.05 USDC
export const DEMO_MEMO = "Till demo — agent checkout on Arc";
export const DEMO_SALT = "demo";

const MEMO_MAX = 280;

export function demoInvoice(): Invoice {
  const payee = (process.env.NEXT_PUBLIC_DEMO_PAYEE ?? "") as Address;
  const fallback = "0x054b1d7859CFFb53284a1461Dde9179Df7CF182f" as Address;
  return {
    v: 1,
    payee: isAddress(payee) ? payee : fallback,
    amount: process.env.NEXT_PUBLIC_DEMO_AMOUNT ?? DEMO_AMOUNT,
    memo: DEMO_MEMO,
    salt: DEMO_SALT,
  };
}

export function canonicalize(invoice: Invoice): Invoice {
  return {
    v: 1,
    payee: invoice.payee.toLowerCase() as Address,
    amount: invoice.amount,
    memo: invoice.memo,
    salt: invoice.salt,
  };
}

export function encodeInvoice(invoice: Invoice): string {
  return utf8ToBase64Url(JSON.stringify(canonicalize(invoice)));
}

export function decodeInvoice(id: string): Invoice {
  if (id === "demo") return demoInvoice();
  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlToUtf8(id));
  } catch {
    throw new Error("Invoice id is not valid.");
  }
  return parseInvoice(parsed);
}

export function parseInvoice(value: unknown): Invoice {
  if (!value || typeof value !== "object") throw new Error("Invoice is empty.");
  const raw = value as Record<string, unknown>;
  if (raw.v !== 1) throw new Error("Unknown invoice version.");
  if (typeof raw.payee !== "string" || !isAddress(raw.payee)) throw new Error("Payee is not an address.");
  if (typeof raw.amount !== "string" || !/^[1-9][0-9]{0,17}$/.test(raw.amount)) {
    throw new Error("Amount must be a positive integer in atomic USDC.");
  }
  if (typeof raw.memo !== "string" || raw.memo.length === 0 || raw.memo.length > MEMO_MAX) {
    throw new Error(`Memo must be 1–${MEMO_MAX} characters.`);
  }
  if (typeof raw.salt !== "string" || raw.salt.length === 0 || raw.salt.length > 64) {
    throw new Error("Salt is missing.");
  }
  return canonicalize({
    v: 1,
    payee: raw.payee as Address,
    amount: raw.amount,
    memo: raw.memo,
    salt: raw.salt,
  });
}

export function createInvoice(input: { payee: Address; amountUsdc: string; memo: string }): Invoice {
  const atomic = usdcToAtomic(input.amountUsdc);
  if (atomic === 0n) throw new Error("Amount must be greater than zero.");
  return canonicalize({
    v: 1,
    payee: input.payee,
    amount: atomic.toString(),
    memo: input.memo.trim(),
    salt: randomSalt(),
  });
}

export function invoiceId(invoice: Invoice): Hex {
  return keccak256(toBytes(JSON.stringify(canonicalize(invoice))));
}

export function contentHash(invoice: Invoice): Hex {
  return keccak256(toBytes(invoice.memo));
}

export function formatUsdc(atomic: string | bigint): string {
  const value = typeof atomic === "bigint" ? atomic : BigInt(atomic);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const whole = abs / 1_000_000n;
  const frac = (abs % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  const rendered = frac.length === 0 ? whole.toString() : `${whole.toString()}.${frac}`;
  return negative ? `-${rendered}` : rendered;
}

export function usdcToAtomic(display: string): bigint {
  const trimmed = display.trim();
  if (!/^\d+(\.\d{1,6})?$/.test(trimmed)) throw new Error("Amount must be USDC with at most 6 decimals.");
  const [whole, frac = ""] = trimmed.split(".");
  return BigInt(whole) * 1_000_000n + BigInt(frac.padEnd(6, "0"));
}

export function invoiceConfigured(invoice: Invoice): boolean {
  return invoice.payee !== "0x0000000000000000000000000000000000000000";
}

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function chainLabel(): string {
  return chainIdFromEnv() === 5042002 ? "Arc Testnet" : "Arc";
}

function utf8ToBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToUtf8(id: string): string {
  const b64 = id.replaceAll("-", "+").replaceAll("_", "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
