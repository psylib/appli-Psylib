#!/bin/bash
set -euo pipefail

# PsyScale — Keycloak PostgreSQL Backup (OVH VPS)
# Cron: 0 3 * * * /opt/psyscale-keycloak/scripts/backup-keycloak-db.sh >> /var/log/keycloak-backup.log 2>&1

BACKUP_DIR="/opt/psyscale-backups/keycloak"
CONTAINER_NAME="keycloak-db"
DB_USER="keycloak"
DB_NAME="keycloak"
RETENTION_DAYS=30
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/keycloak-${DATE}.sql.gz"

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
echo "[$(date)] Backup termine."
