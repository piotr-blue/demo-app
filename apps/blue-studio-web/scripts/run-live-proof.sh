#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CREDS_FILE="${LIVE_PROOF_CREDENTIALS_FILE:-/opt/cursor/artifacts/live-credentials.json}"
EXAMPLE_FILE="/opt/cursor/artifacts/live-credentials.example.json"

if [[ ! -f "$CREDS_FILE" ]]; then
  cat >&2 <<EOF
[live-proof] Missing credentials file: $CREDS_FILE

Create it using this template:
  cp "$EXAMPLE_FILE" "$CREDS_FILE"
  # then fill openAiApiKey / myOsApiKey / myOsAccountId

Or export env vars directly:
  OPENAI_API_KEY, MYOS_API_KEY, MYOS_ACCOUNT_ID, optionally MYOS_BASE_URL
EOF
  exit 2
fi

echo "[live-proof] Running mandatory live proof spec..."
cd "$ROOT_DIR"
npm run test:live -w blue-studio-web -- live-tests/live-account-proof.spec.ts
