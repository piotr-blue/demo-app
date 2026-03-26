#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
RUNNER="$ROOT_DIR/apps/blue-studio-web/scripts/run-live-proof.sh"
CREDS_FILE="${LIVE_PROOF_CREDENTIALS_FILE:-/opt/cursor/artifacts/live-credentials.json}"
INTERVAL_SECONDS="${LIVE_PROOF_WATCH_INTERVAL_SECONDS:-15}"
TIMEOUT_SECONDS="${LIVE_PROOF_WATCH_TIMEOUT_SECONDS:-3600}"

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

echo "[live-proof-watch] waiting for credentials..."
echo "[live-proof-watch] file: $CREDS_FILE"
echo "[live-proof-watch] interval: ${INTERVAL_SECONDS}s, timeout: ${TIMEOUT_SECONDS}s"

elapsed=0
while (( elapsed <= TIMEOUT_SECONDS )); do
  if has_env_creds || has_file_creds; then
    echo "[live-proof-watch] credentials detected, running mandatory proof."
    exec bash "$RUNNER"
  fi

  if (( elapsed == TIMEOUT_SECONDS )); then
    break
  fi

  sleep "$INTERVAL_SECONDS"
  elapsed=$((elapsed + INTERVAL_SECONDS))
done

echo "[live-proof-watch] timeout reached without credentials."
exit 3
