#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
HOST="${HOST:-127.0.0.1}"
MAX_TRIES="${MAX_TRIES:-20}"

is_port_free() {
  local host="$1"
  local port="$2"
  if command -v lsof >/dev/null 2>&1; then
    ! lsof -iTCP:"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1
  else
    ! nc -z "$host" "$port" >/dev/null 2>&1
  fi
}

pick_port() {
  local host="$1"
  local start_port="$2"
  local tries="$3"
  local p="$start_port"

  for _ in $(seq 1 "$tries"); do
    if is_port_free "$host" "$p"; then
      echo "$p"
      return 0
    fi
    p=$((p + 1))
  done

  echo "Could not find a free port in range ${start_port}-$((start_port + tries - 1))" >&2
  return 1
}

CHOSEN_PORT="$(pick_port "$HOST" "$PORT" "$MAX_TRIES")"
URL="http://localhost:${CHOSEN_PORT}"

pnpm exec next dev --hostname "$HOST" --port "$CHOSEN_PORT" &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for _ in {1..90}; do
  if curl -fsS "http://${HOST}:${CHOSEN_PORT}" >/dev/null 2>&1; then
    open "$URL" >/dev/null 2>&1 || true
    wait "$SERVER_PID"
    exit $?
  fi
  sleep 1
done

echo "Timed out waiting for dev server at ${URL}" >&2
exit 1
