#!/usr/bin/env node
/**
 * Pay a Till invoice over HTTP 402 with Circle Gateway on Arc.
 *
 *   PRIVATE_KEY=0x... node --env-file=.env.local scripts/pay.mjs https://till.example/api/i/demo
 *
 * Deposits 1 USDC into Gateway if the available balance is too low, then pays.
 * There is no API key. The 402 challenge is the auth.
 */
import { GatewayClient } from "@circle-fin/x402-batching/client";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/pay.mjs <invoice-api-url>");
  process.exit(1);
}

const key = process.env.PRIVATE_KEY ?? process.env.RECORDER_PRIVATE_KEY;
if (!key) {
  console.error("Set PRIVATE_KEY to an Arc EOA that holds USDC.");
  process.exit(1);
}

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "5042");
const chain = chainId === 5042002 ? "arcTestnet" : "arc";

const client = new GatewayClient({
  chain,
  privateKey: (key.startsWith("0x") ? key : `0x${key}`),
  rpcUrl: process.env.ARC_RPC_URL,
});

const balances = await client.getBalances();
console.log(`wallet  ${balances.wallet.formatted} USDC`);
console.log(`gateway ${balances.gateway.formattedAvailable} USDC available`);

if (balances.gateway.available < 100_000n) {
  console.log("Depositing 1 USDC into Circle Gateway…");
  const deposit = await client.deposit("1");
  console.log(`deposit ${deposit.depositTxHash}`);
}

const support = await client.supports(url);
if (!support.supported) {
  console.error(`This URL does not accept Gateway payments on ${chain}: ${support.error}`);
  process.exit(1);
}

const paid = await client.pay(url);
console.log(`status  ${paid.status}`);
console.log(`paid    ${paid.formattedAmount} USDC`);
if (paid.transaction) console.log(`settle  ${paid.transaction}`);
console.log("receipt");
console.dir(paid.data, { depth: null });
