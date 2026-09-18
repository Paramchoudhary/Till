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

```
https://github.com/Paramchoudhary/Till
```

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

## Submission tab (Arc Microgrants)

**Live deployment on Arc mainnet**

```
https://till-arc.vercel.app/i/demo
```

**Arc mainnet contract or tx**

```
https://arc-scan.org/address/0x491d83CcEFa45C2195193934db2CD9e77Ca540f2
```

or the deploy tx:

```
0x8430d4d4aecc0f0d2431b12c7f922c6694c86949de8a15dfc2bd32b92fb89b91
```

**Public repo**

```
https://github.com/Paramchoudhary/Till
```

**In two sentences, what does your project do?**

```
Till is an HTTP 402 checkout for USDC invoices: a human or an agent pays the same bill with no API key. Circle’s x402 facilitator settles on Arc, then an immutable receipt is written on-chain.
```

**What does it use Arc for?**

```
Arc is the settlement and receipt layer. Gas is USDC so a $0.05 invoice costs $0.05, finality is sub-second, and Circle’s Gateway x402 facilitator is native on eip155:5042. Receipts.sol is immutable: pay() for wallets, record() after an agent settle, no withdraw.
```

**Have you received a Circle or Arc grant, bounty, or prize for this project?** No.
