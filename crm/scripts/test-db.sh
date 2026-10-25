#!/usr/bin/env bash
# Runs the database security tests (supabase/tests/*.test.sql) against a
# throwaway local Postgres. Needs Postgres installed locally (initdb, pg_ctl,
# psql). Your real Supabase database is never touched.
#
#   npm run test:db
set -euo pipefail

cd "$(dirname "$0")/.."

# Find the Postgres binaries (Homebrew / Debian / PATH).
if ! command -v initdb >/dev/null 2>&1; then
  for dir in /usr/lib/postgresql/*/bin /opt/homebrew/opt/postgresql@*/bin /usr/local/opt/postgresql@*/bin; do
    [ -x "$dir/initdb" ] && PATH="$dir:$PATH" && break
  done
fi
command -v initdb >/dev/null 2>&1 || { echo "Postgres is not installed; skipping DB tests."; exit 1; }
BIN="$(dirname "$(command -v initdb)")"

TMP="$(mktemp -d)"
PORT="${TEST_DB_PORT:-54329}"
RUN_AS=()
# Postgres refuses to run as root (e.g. inside containers).
if [ "$(id -u)" = "0" ]; then
  chown -R postgres "$TMP"
  RUN_AS=(sudo -u postgres)
  command -v sudo >/dev/null 2>&1 || RUN_AS=(su postgres -s /bin/bash -c)
fi

run() {
  if [ "${#RUN_AS[@]}" -eq 0 ]; then "$@";
  elif [ "${RUN_AS[0]}" = "su" ]; then "${RUN_AS[@]}" "$(printf '%q ' "$@")";
  else "${RUN_AS[@]}" "$@"; fi
}

cleanup() { run "$BIN/pg_ctl" -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT

run "$BIN/initdb" -D "$TMP/data" -U postgres --auth=trust >/dev/null
run "$BIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" -w start >/dev/null

PSQL=("$BIN/psql" -h "$TMP" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X -o /dev/null)

run "${PSQL[@]}" -f supabase/tests/_supabase_stub.sql
for f in supabase/migrations/*.sql; do
  echo "migrate  $f"
  run "${PSQL[@]}" -f "$f"
done
for f in supabase/tests/*.test.sql; do
  echo "test     $f"
  run "${PSQL[@]}" -f "$f"
done
echo "All database tests passed."
