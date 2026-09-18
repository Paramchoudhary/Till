import { defineChain, type Address, type Hex } from "viem";

export const USDC = "0x3600000000000000000000000000000000000000" as const;

const nativeCurrency = { name: "USD Coin", symbol: "USDC", decimals: 18 } as const;

const TESTNET_RPCS = [
  "https://rpc.blockdaemon.testnet.arc.io",
  "https://rpc.drpc.testnet.arc.io",
  "https://rpc.quicknode.testnet.arc.io",
  "https://rpc.testnet.arc.io",
] as const;

const MAINNET_RPCS = [
  "https://rpc.blockdaemon.mainnet.arc.io",
  "https://rpc.drpc.mainnet.arc.io",
  "https://rpc.quicknode.mainnet.arc.io",
  "https://rpc.mainnet.arc.io",
] as const;

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency,
  rpcUrls: { default: { http: [...TESTNET_RPCS] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
  testnet: true,
});

export const arc = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency,
  rpcUrls: { default: { http: [...MAINNET_RPCS] } },
  blockExplorers: { default: { name: "Arcscan", url: "https://arc-scan.org" } },
});

export const ARC_MAINNET_ID = 5042;
export const ARC_TESTNET_ID = 5042002;

export type ArcChainId = typeof ARC_MAINNET_ID | typeof ARC_TESTNET_ID;

export function chainIdFromEnv(): ArcChainId {
  const raw = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? ARC_MAINNET_ID);
  if (raw === ARC_TESTNET_ID) return ARC_TESTNET_ID;
  return ARC_MAINNET_ID;
}

export function chainFor(chainId: number) {
  return chainId === ARC_TESTNET_ID ? arcTestnet : arc;
}

export function rpcFor(chainId: number): string {
  return chainId === ARC_TESTNET_ID ? TESTNET_RPCS[0] : MAINNET_RPCS[0];
}

export function explorerFor(chainId: number): string {
  return chainId === ARC_TESTNET_ID ? "https://testnet.arcscan.app" : "https://arc-scan.org";
}

export function caip2(chainId: number): `eip155:${number}` {
  return `eip155:${chainId}`;
}

export const GATEWAY_WALLET: Record<ArcChainId, Address> = {
  [ARC_MAINNET_ID]: "0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE",
  [ARC_TESTNET_ID]: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
};

export const FACILITATOR_URL: Record<ArcChainId, string> = {
  [ARC_MAINNET_ID]: "https://gateway-api.circle.com",
  [ARC_TESTNET_ID]: "https://gateway-api-testnet.circle.com",
};

export const GATEWAY_CHAIN_NAME: Record<ArcChainId, "arc" | "arcTestnet"> = {
  [ARC_MAINNET_ID]: "arc",
  [ARC_TESTNET_ID]: "arcTestnet",
};

export const MAX_TIMEOUT_SECONDS = 604_900;

export function receiptsAddress(): Address | null {
  const raw = process.env.NEXT_PUBLIC_RECEIPTS_ADDRESS;
  if (!raw || !/^0x[0-9a-fA-F]{40}$/.test(raw)) return null;
  return raw as Address;
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export function txUrl(chainId: number, hash: Hex): string {
  return `${explorerFor(chainId)}/tx/${hash}`;
}

export function addressUrl(chainId: number, address: Address): string {
  return `${explorerFor(chainId)}/address/${address}`;
}
