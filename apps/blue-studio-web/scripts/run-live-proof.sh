#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CREDS_FILE="${LIVE_PROOF_CREDENTIALS_FILE:-/opt/cursor/artifacts/live-credentials.json}"
EXAMPLE_FILE="/opt/cursor/artifacts/live-credentials.example.json"
LOG_FILE="${LIVE_PROOF_LOG_FILE:-/opt/cursor/artifacts/live-proof-run.log}"
DETAILS_FILE="${LIVE_PROOF_DETAILS_FILE:-/opt/cursor/artifacts/live-proof-order-details.json}"
CHECK_ONLY="${1:-}"

has_env_creds() {
  [[ -n "${OPENAI_API_KEY:-}" && -n "${MYOS_API_KEY:-}" && -n "${MYOS_ACCOUNT_ID:-}" ]]
}

has_file_creds() {
  [[ -f "$CREDS_FILE" ]]
}

if ! has_env_creds && ! has_file_creds; then
  cat >&2 <<EOF
[live-proof] Missing credentials for mandatory live proof.

Provide one of:
  1) Environment variables:
     OPENAI_API_KEY, MYOS_API_KEY, MYOS_ACCOUNT_ID, optionally MYOS_BASE_URL

  2) Credentials file:
     cp "$EXAMPLE_FILE" "$CREDS_FILE"
     # then fill openAiApiKey / myOsApiKey / myOsAccountId
EOF
  exit 2
fi

if [[ "$CHECK_ONLY" == "--check-only" ]]; then
  if has_env_creds; then
    echo "[live-proof] Credentials source: env"
  else
    echo "[live-proof] Credentials source: file ($CREDS_FILE)"
  fi
  echo "[live-proof] Ready to execute mandatory live proof."
  exit 0
fi

echo "[live-proof] Running mandatory live proof spec..."
cd "$ROOT_DIR"
if has_file_creds; then
  export LIVE_PROOF_CREDENTIALS_FILE="$CREDS_FILE"
fi

npm run test:live -w blue-studio-web -- live-tests/live-account-proof.spec.ts | tee "$LOG_FILE"

if rg -q "MANDATORY_PROOF_ORDER_DETAILS" "$LOG_FILE"; then
  node -e "
const fs=require('node:fs');
const logPath=process.argv[1];
const detailsPath=process.argv[2];
const content=fs.readFileSync(logPath,'utf8');
const marker='MANDATORY_PROOF_ORDER_DETAILS';
const index=content.lastIndexOf(marker);
if(index<0){process.exit(0);}
const raw=content.slice(index + marker.length).trim();
const start=raw.indexOf('{');
if(start<0){process.exit(0);}
const jsonText=raw.slice(start).trim();
let depth=0, end=-1;
for(let i=0;i<jsonText.length;i++){
  const ch=jsonText[i];
  if(ch==='{') depth++;
  if(ch==='}') depth--;
  if(depth===0){end=i+1;break;}
}
if(end<0){process.exit(0);}
const parsed=JSON.parse(jsonText.slice(0,end));
fs.writeFileSync(detailsPath, JSON.stringify(parsed, null, 2) + '\n');
" "$LOG_FILE" "$DETAILS_FILE"
  echo "[live-proof] Extracted order details -> $DETAILS_FILE"
else
  echo "[live-proof] No MANDATORY_PROOF_ORDER_DETAILS marker found in log."
fi
echo "[live-proof] Full run log saved to $LOG_FILE"
