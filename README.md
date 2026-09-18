# Till

**A human creates an invoice. An agent pays it in USDC over HTTP 402. Arc records a final receipt.**

Built for [Arc Microgrants](https://dorahacks.io/hackathon/arc-microgrants/detail). Arc is required because gas is dollars, finality is sub-second, and Circle’s x402 facilitator is native here.

Live: [till-arc.vercel.app](https://till-arc.vercel.app) · demo invoice: [/i/demo](https://till-arc.vercel.app/i/demo)

```
create invoice → share the link → wallet or agent pays USDC → receipt on Arc
```

There is no API key. The `402 Payment Required` challenge is the auth.

## Run locally

```bash
# contracts
cd contracts && forge test

# web
cd web
cp .env.example .env.local
npm install
npm test
npm run dev          # http://localhost:3000
```

Create an invoice at `/new`, or open the demo at `/i/demo`. Agents hit `/api/i/{id}`:

```bash
curl -i http://localhost:3000/api/i/demo
node scripts/pay.mjs http://localhost:3000/api/i/demo
```

`scripts/pay.mjs` lives next to this README and also under `web/scripts` (same file). It uses `@circle-fin/x402-batching` `GatewayClient` with `chain: "arc"` (or `arcTestnet`). Fund the key from [faucet.circle.com](https://faucet.circle.com) on testnet. The first run deposits 1 USDC into Circle Gateway if the available balance is low.

## Deploy to Arc

Gas is USDC. Put `PRIVATE_KEY` in `contracts/.env`.

```bash
chmod +x scripts/deploy.sh
scripts/deploy.sh arc_testnet    # chain 5042002
scripts/deploy.sh arc            # chain 5042 mainnet
```

The script deploys immutable `Receipts` and writes `web/.env.local` with the contract address, demo payee (the recorder), and recorder key used to call `record` after an x402 settle.

Then:

```bash
cd web && npm run build && npm start
```

Point `NEXT_PUBLIC_SITE_URL` at the public origin before you submit.

## What is on-chain

[`contracts/src/Receipts.sol`](contracts/src/Receipts.sol) is a 70-line contract:

- `pay` — humans. Pulls ERC-20 USDC (`0x3600…0000`, 6 decimals) to the payee and writes the receipt.
- `record` — the server, after Circle Gateway settles an x402 payment. No second pull.
- No withdraw. Recorder and USDC token are immutable.

Arc exposes USDC twice (18-decimal native gas, 6-decimal ERC-20 facade). Till never sends native value.

## x402

`GET /api/i/{id}` without `Payment-Signature` returns **402** with a `PAYMENT-REQUIRED` header. The only accepted network is `eip155:5042` (or `eip155:5042002` on testnet). `payTo` is the invoice payee.

With a valid Circle Gateway signature the route calls `BatchFacilitatorClient.settle`, then `Receipts.record`.

## Pages

| | |
| --- | --- |
| `/` | One-screen pitch and the demo button |
| `/new` | Create an invoice (amount, memo, payee) |
| `/i/[id]` | Payable page: wallet pay or agent instructions |
| `/r/[id]` | Public receipt |

Invoice ids are URL-safe encodings of `{payee, amount, memo, salt}`. `demo` is a special id.

## Live on Arc Mainnet

Receipts: [`0x491d83CcEFa45C2195193934db2CD9e77Ca540f2`](https://arc-scan.org/address/0x491d83CcEFa45C2195193934db2CD9e77Ca540f2)

Deploy tx: [`0x8430d4d4aecc0f0d2431b12c7f922c6694c86949de8a15dfc2bd32b92fb89b91`](https://arc-scan.org/tx/0x8430d4d4aecc0f0d2431b12c7f922c6694c86949de8a15dfc2bd32b92fb89b91)

Testnet Receipts remains at [`0x905637188A6A9638480D5feF3733881ce1dA055f`](https://testnet.arcscan.app/address/0x905637188A6A9638480D5feF3733881ce1dA055f). See [docs/ADDRESSES.md](docs/ADDRESSES.md).

## DoraHacks

Submission copy is in [SUBMISSION.md](SUBMISSION.md). Submit the **live mainnet URL** plus this public repo. Do not wait until 14 October — reviews are rolling.
