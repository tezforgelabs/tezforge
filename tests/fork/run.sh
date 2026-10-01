#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
local_rpc="http://127.0.0.1:8547"
fork_rpc="https://evm.previewnet.tezosx.nomadic-labs.com"

for tool in anvil cast lsof pnpm; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$tool" >&2
    exit 1
  fi
done

# Refuse a pre-existing listener: otherwise a failed Anvil launch could cause
# the tests to talk to an unrelated RPC service on this port.
if lsof -nP -iTCP:8547 -sTCP:LISTEN >/dev/null 2>&1; then
  printf 'Port 8547 is already in use; stop that process before running fork tests.\n' >&2
  exit 1
fi

anvil --fork-url "$fork_rpc" --host 127.0.0.1 --port 8547 --silent >/dev/null 2>&1 &
anvil_pid=$!

cleanup() {
  kill "$anvil_pid" 2>/dev/null || true
  wait "$anvil_pid" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

ready=false
for _ in {1..30}; do
  if ! kill -0 "$anvil_pid" 2>/dev/null; then
    printf 'Anvil exited before the local fork became ready.\n' >&2
    exit 1
  fi
  if [[ "$(cast chain-id --rpc-url "$local_rpc" 2>/dev/null || true)" == "128064" ]]; then
    ready=true
    break
  fi
  sleep 1
done

if [[ "$ready" != true ]]; then
  printf 'Local Anvil fork did not become ready on %s.\n' "$local_rpc" >&2
  exit 1
fi

cd "$repo_root"
pnpm exec vitest run --config tests/fork/vitest.config.ts
