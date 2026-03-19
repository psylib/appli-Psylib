#!/bin/bash
TOKEN="vca_46LonRNqhEoI83OoLQhNHZ8rzCC00udQgWzZlhwWNDgTF7up0b2udsyF"
TEAM="team_Oxj8h4wbyW5iAxskacqRYBKH"
URL="https://api.vercel.com/v10/projects/psyscale-web/env?teamId=${TEAM}"
HDR="Authorization: Bearer ${TOKEN}"

post() {
  local key="$1" val="$2" type="${3:-encrypted}"
  local body="{\"key\":\"${key}\",\"value\":\"${val}\",\"type\":\"${type}\",\"target\":[\"production\"]}"
  result=$(curl -s -X POST "$URL" -H "$HDR" -H "Content-Type: application/json" -d "$body")
  echo "$result" | grep -o '"key":"[^"]*"' | head -1
}

post "NEXTAUTH_SECRET"     "0oTlP7ON17upINdxphQKDK0EgUdwUFbMNmAhcls5zIY="
post "NEXT_PUBLIC_API_URL" "https://api.psylib.eu"  "plain"
post "NEXT_PUBLIC_WS_URL"  "wss://api.psylib.eu"    "plain"
post "KEYCLOAK_REALM"      "psyscale"                 "plain"
post "KEYCLOAK_CLIENT_ID"  "psyscale-app"             "plain"
echo "All done"
