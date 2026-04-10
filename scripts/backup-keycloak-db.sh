#!/bin/bash
set -euo pipefail

# PsyScale — Keycloak PostgreSQL Backup (OVH VPS)
# Cron: 0 3 * * * /opt/psyscale-keycloak/scripts/backup-keycloak-db.sh >> /var/log/keycloak-backup.log 2>&1
#
# Si HEALTHCHECKS_KEYCLOAK_URL est defini, ping de succes/echec envoye a healthchecks.io.
# Si OVH_S3_* sont definis, sync automatique vers OVH Object Storage.

BACKUP_DIR="/opt/psyscale-backups/keycloak"
CONTAINER_NAME="keycloak-db"
DB_USER="keycloak"
DB_NAME="keycloak"
RETENTION_DAYS=30
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/keycloak-${DATE}.sql.gz"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ping_heartbeat() {
  local endpoint="${1:-}"
  local url="${HEALTHCHECKS_KEYCLOAK_URL:-${HEALTHCHECKS_BACKUP_URL:-}}"
  if [ -n "$url" ]; then
    curl -fsS -m 10 --retry 3 -o /dev/null "${url}${endpoint}" || true
  fi
}

trap 'ping_heartbeat /fail; echo "[$(date)] Backup Keycloak ECHEC"' ERR

echo "[$(date)] Backup Keycloak DB demarrage..."

mkdir -p "$BACKUP_DIR"

docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE" 2>/dev/null

GZ_SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")
if [ "$GZ_SIZE" -lt 500 ]; then
  echo "[$(date)] ERREUR: Backup trop petit (${GZ_SIZE}B)"
  exit 1
fi

echo "[$(date)] Backup OK: ${BACKUP_FILE} (${GZ_SIZE} bytes)"

find "$BACKUP_DIR" -name "keycloak-*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# ── Sync cross-cloud vers OVH Object Storage (si configure) ──────────────────
if [ -n "${OVH_S3_ENDPOINT:-}" ] && [ -x "${SCRIPT_DIR}/sync-backups-to-ovh.sh" ]; then
  echo "[$(date)] Sync Keycloak vers OVH Object Storage..."
  if "${SCRIPT_DIR}/sync-backups-to-ovh.sh"; then
    echo "[$(date)] Sync OVH: OK"
  else
    echo "[$(date)] Sync OVH: ECHEC (non-fatal)"
  fi
fi

echo "[$(date)] Backup termine."

# ── Heartbeat de succes ──────────────────────────────────────────────────────
ping_heartbeat ""
