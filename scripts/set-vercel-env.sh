#!/bin/bash
set -euo pipefail

# PsyScale — Set Vercel environment variables
# Usage: VERCEL_TOKEN=xxx VERCEL_TEAM_ID=xxx ./scripts/set-vercel-env.sh
#
# NEVER hardcode secrets in this file. Use environment variables.

TOKEN="${VERCEL_TOKEN:?Variable VERCEL_TOKEN requise}"
TEAM="${VERCEL_TEAM_ID:?Variable VERCEL_TEAM_ID requise}"
URL="https://api.vercel.com/v10/projects/psyscale-web/env?teamId=${TEAM}"
HDR="Authorization: Bearer ${TOKEN}"

post() {
  local key="$1" val="$2" type="${3:-encrypted}"
  local body="{\"key\":\"${key}\",\"value\":\"${val}\",\"type\":\"${type}\",\"target\":[\"production\"]}"
  result=$(curl -s -X POST "$URL" -H "$HDR" -H "Content-Type: application/json" -d "$body")
  echo "$result" | grep -o '"key":"[^"]*"' | head -1
}

# Secrets are passed as env vars — never hardcoded
post "NEXTAUTH_SECRET"     "${NEXTAUTH_SECRET:?Variable NEXTAUTH_SECRET requise}"
post "NEXT_PUBLIC_API_URL" "https://api.psylib.eu"  "plain"
post "NEXT_PUBLIC_WS_URL"  "wss://api.psylib.eu"    "plain"
post "KEYCLOAK_REALM"      "psyscale"                 "plain"
post "KEYCLOAK_CLIENT_ID"  "psyscale-app"             "plain"
echo "All done"
