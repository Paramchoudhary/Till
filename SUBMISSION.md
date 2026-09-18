# DoraHacks Profile tab — paste this

Form: Create a new BUIDL (Profile)

## BUIDL (project) name

Till

## BUIDL logo

File: `till/web/public/logo.png`  
JPEG, 1024×1024, ~94 KB (under 2 MB). Recommended size is 480×480; this is larger and will scale down.

## Vision

Agents can call APIs. They still cannot pay an invoice. Cards, API keys, and accounts all assume a human. Till makes a USDC invoice payable over HTTP 402 on Arc: a wallet or an agent settles the same bill, Circle’s facilitator moves the dollars, and an immutable receipt is written on-chain. No API key. Gas is dollars, so a $0.05 charge is actually $0.05.

## Category

Crypto / Web3

## GitHub/Gitlab/Bitbucket

Do **not** use the onArc launchpad repo.

Till is the folder `till/` on disk and is not on GitHub yet. Create a **new public repo** that contains only Till, then paste that URL, for example:

`https://github.com/Paramchoudhary/till-arc`

If you want this created and pushed for you, say so.

## Project website

https://till-arc.vercel.app

Demo invoice: https://till-arc.vercel.app/i/demo

## Demo video

Leave blank unless you have a recording.

## Social links (at least one)

https://x.com/Param_eth

https://github.com/Paramchoudhary

(Swap the X link if that is not your account.)

---

## After Profile → Details

Use this for the project description:

Till is an HTTP 402 checkout for invoices. A human or an agent pays USDC; Circle’s x402 facilitator settles on Arc; an immutable receipt is written on-chain. Arc is required because gas is dollars, finality is sub-second, and the facilitator is native here.

---

## Honest constraint

The live site is on **Arc Testnet** today. DoraHacks rejects testnet-only builds. Mainnet deploy needs ~0.02 USDC for gas on `0x054b1d7859CFFb53284a1461Dde9179Df7CF182f`, then `scripts/deploy.sh arc`.
