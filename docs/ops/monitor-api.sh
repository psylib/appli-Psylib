#!/bin/bash
# PsyLib Uptime Monitor — alerte email si endpoint DOWN
# Cron: */5 * * * * /opt/monitor/monitor.sh >> /opt/monitor/monitor.log 2>&1
#
# v2 (2026-06-28): la sonde API tape la stack LOCALE via --resolve 127.0.0.1.
#   Pourquoi : depuis le VPS, curl vers l'IP publique api.psylib.eu time-out
#   (hairpin NAT/firewall AZNetwork) -> fausses alertes "DOWN HTTP 000" alors
#   que l'API repond parfaitement aux vrais utilisateurs (externes).
#   --resolve 127.0.0.1 teste nginx + TLS (cert reel) + app en local, sans
#   sortir sur l'IP publique. + retry x3 avant alerte (anti faux-positif).
#   Le check Frontend reste public (Vercel = externe, pas de hairpin).

RESEND_API_KEY=$(grep '^RESEND_API_KEY=' /opt/psyscale-api/.env | cut -d= -f2 | tr -d '\r')
ALERT_EMAIL='psylib.eu@gmail.com'
FROM_EMAIL='PsyLib Monitoring <noreply@send.psylib.eu>'
FLAG_DIR='/tmp/psylib-monitor'
RETRIES=3
RETRY_DELAY=10
mkdir -p "$FLAG_DIR"

# probe <url> [resolve]  -> echo le code HTTP final, avec retry
probe() {
  local url=$1 resolve=$2 code=000 i
  for i in $(seq 1 "$RETRIES"); do
    if [ -n "$resolve" ]; then
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 --resolve "$resolve" "$url" 2>/dev/null)
    else
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$url" 2>/dev/null)
    fi
    [ "$code" = "200" ] && break
    [ "$i" -lt "$RETRIES" ] && sleep "$RETRY_DELAY"
  done
  echo "$code"
}

check_endpoint() {
  local url=$1 name=$2 resolve=$3
  local flag="$FLAG_DIR/$(echo $name | tr ' ' '_').down"
  local http_code
  http_code=$(probe "$url" "$resolve")

  if [ "$http_code" != "200" ]; then
    if [ ! -f "$flag" ]; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERTE: $name est DOWN (HTTP $http_code)"
      touch "$flag"
      curl -s -X POST 'https://api.resend.com/emails' \
        -H "Authorization: Bearer $RESEND_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{\"from\":\"$FROM_EMAIL\",\"to\":\"$ALERT_EMAIL\",\"subject\":\"[ALERTE] $name est DOWN\",\"html\":\"<p><strong>$name</strong> ne répond plus.</p><p>Code HTTP : <strong>$http_code</strong> (après $RETRIES tentatives)</p><p>URL : $url</p><p>Heure : $(date)</p>\"}" > /dev/null
    fi
  else
    if [ -f "$flag" ]; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] RÉTABLI: $name est de nouveau UP"
      rm -f "$flag"
      curl -s -X POST 'https://api.resend.com/emails' \
        -H "Authorization: Bearer $RESEND_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{\"from\":\"$FROM_EMAIL\",\"to\":\"$ALERT_EMAIL\",\"subject\":\"[RÉTABLI] $name est de nouveau UP\",\"html\":\"<p><strong>$name</strong> est de nouveau accessible.</p><p>Heure : $(date)</p>\"}" > /dev/null
    fi
  fi
}

# API : sonde la stack locale (nginx+TLS+app) en contournant le hairpin NAT.
check_endpoint 'https://api.psylib.eu/api/v1/health' 'API PsyLib' 'api.psylib.eu:443:127.0.0.1'
# Frontend : Vercel (externe, pas de hairpin) — sonde publique normale.
check_endpoint 'https://psylib.eu' 'Frontend PsyLib' ''
