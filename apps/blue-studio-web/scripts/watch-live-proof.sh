#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
RUNNER="$ROOT_DIR/apps/blue-studio-web/scripts/run-live-proof.sh"
CREDS_FILE="${LIVE_PROOF_CREDENTIALS_FILE:-/opt/cursor/artifacts/live-credentials.json}"
INTERVAL_SECONDS="${LIVE_PROOF_WATCH_INTERVAL_SECONDS:-15}"
TIMEOUT_SECONDS="${LIVE_PROOF_WATCH_TIMEOUT_SECONDS:-3600}"

has_env_creds() {
  [[ -n "${OPENAI_API_KEY:-}" && -n "${MYOS_API_KEY:-}" && -n "${MYOS_ACCOUNT_ID:-}" ]]
}

has_file_creds() {
  [[ -f "$CREDS_FILE" ]]
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
