#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CREDS_FILE="${LIVE_PROOF_CREDENTIALS_FILE:-/opt/cursor/artifacts/live-credentials.json}"
EXAMPLE_FILE="/opt/cursor/artifacts/live-credentials.example.json"
LOG_FILE="${LIVE_PROOF_LOG_FILE:-/opt/cursor/artifacts/live-proof-run.log}"
DETAILS_FILE="${LIVE_PROOF_DETAILS_FILE:-/opt/cursor/artifacts/live-proof-order-details.json}"
CHECK_ONLY="${1:-}"

is_placeholder() {
  local value="${1:-}"
  [[ -z "$value" ]] && return 0
  [[ "$value" =~ ^\<.*\>$ ]] && return 0
  [[ "$value" =~ ^(REPLACE_ME|CHANGEME|YOUR_.*_HERE)$ ]] && return 0
  return 1
}

has_env_creds() {
  [[ -n "${OPENAI_API_KEY:-}" && -n "${MYOS_API_KEY:-}" && -n "${MYOS_ACCOUNT_ID:-}" ]] || return 1
  is_placeholder "${OPENAI_API_KEY:-}" && return 1
  is_placeholder "${MYOS_API_KEY:-}" && return 1
  is_placeholder "${MYOS_ACCOUNT_ID:-}" && return 1
  return 0
}

has_file_creds() {
  [[ -f "$CREDS_FILE" ]] || return 1
  node -e '
const fs = require("node:fs");
const filePath = process.argv[1];
const isPlaceholder = (value) => {
  if (typeof value !== "string") return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^<.*>$/.test(trimmed)) return true;
  return /^(REPLACE_ME|CHANGEME|YOUR_.*_HERE)$/i.test(trimmed);
};
const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
const openAiApiKey = typeof json.openAiApiKey === "string" ? json.openAiApiKey : json.OPENAI_API_KEY;
const myOsApiKey = typeof json.myOsApiKey === "string" ? json.myOsApiKey : json.MYOS_API_KEY;
const myOsAccountId = typeof json.myOsAccountId === "string" ? json.myOsAccountId : json.MYOS_ACCOUNT_ID;
if (isPlaceholder(openAiApiKey) || isPlaceholder(myOsApiKey) || isPlaceholder(myOsAccountId)) {
  process.exit(1);
}
' "$CREDS_FILE"
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
     # placeholders like <OPENAI_API_KEY> are treated as missing
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
