#!/usr/bin/env bash
# Deploy Receipts to Arc and write till/web/.env.local
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACTS="$ROOT/contracts"
WEB="$ROOT/web"
NETWORK="${1:-arc_testnet}"

if [[ -f "$CONTRACTS/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$CONTRACTS/.env"
  set +a
elif [[ -f "$ROOT/../contracts/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/../contracts/.env"
  set +a
fi

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "PRIVATE_KEY is required (till/contracts/.env or the environment)." >&2
  exit 1
fi

KEY="$PRIVATE_KEY"
if [[ "$KEY" != 0x* ]]; then
  KEY="0x$KEY"
fi

export PRIVATE_KEY="$KEY"
RECORDER="${TILL_RECORDER:-$(cast wallet address --private-key "$KEY")}"
export TILL_RECORDER="$RECORDER"

if [[ "$NETWORK" == "arc" ]]; then
  RPC="${ARC_RPC_URL:-https://rpc.mainnet.arc.io}"
  CHAIN_ID=5042
  FACILITATOR="https://gateway-api.circle.com"
else
  RPC="${ARC_TESTNET_RPC_URL:-https://rpc.testnet.arc.io}"
  CHAIN_ID=5042002
  FACILITATOR="https://gateway-api-testnet.circle.com"
fi

echo "Deploying Receipts to $NETWORK (chain $CHAIN_ID) as recorder $RECORDER"

LOG="$(mktemp)"
forge script "$CONTRACTS/script/Deploy.s.sol:Deploy" \
  --root "$CONTRACTS" \
  --rpc-url "$RPC" \
  --broadcast \
  --private-key "$KEY" | tee "$LOG"

ADDRESS="$(awk '/Receipts / { print $2 }' "$LOG" | tail -1)"
if [[ ! "$ADDRESS" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
  echo "Could not parse Receipts address from forge output." >&2
  exit 1
fi

CODE="$(cast code "$ADDRESS" --rpc-url "$RPC")"
if [[ "$CODE" == "0x" || -z "$CODE" ]]; then
  echo "No code at $ADDRESS — broadcast did not land. Fund the deployer with ~0.02 USDC for gas." >&2
  exit 1
fi

SITE="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"
cat > "$WEB/.env.local" <<EOF
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_SITE_URL=$SITE
NEXT_PUBLIC_RECEIPTS_ADDRESS=$ADDRESS
NEXT_PUBLIC_DEMO_PAYEE=$RECORDER
NEXT_PUBLIC_DEMO_AMOUNT=50000
RECORDER_PRIVATE_KEY=$KEY
FACILITATOR_URL=$FACILITATOR
EOF

echo "Wrote $WEB/.env.local"
echo "Receipts $ADDRESS"
echo "Demo payee $RECORDER"
