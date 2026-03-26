#!/bin/bash
set -euo pipefail

# PsyScale — PostgreSQL Backup (OVH VPS)
# Usage: ./scripts/backup-postgres.sh
# Cron: 0 2 * * * /opt/psyscale-api/scripts/backup-postgres.sh >> /var/log/psyscale-backup.log 2>&1
#
# Backups stockes dans /opt/psyscale-backups/ avec rotation 30 jours

BACKUP_DIR="/opt/psyscale-backups"
CONTAINER_NAME="psyscale-api-postgres-1"
DB_USER="${POSTGRES_USER:-psyscale}"
DB_NAME="${POSTGRES_DB:-psyscale}"
RETENTION_DAYS=30
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/psyscale-${DATE}.sql.gz"

echo "[$(date)] Backup PostgreSQL demarrage..."

# Creer le repertoire si inexistant
mkdir -p "$BACKUP_DIR"

# Dump compresse
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --format=custom --compress=6 > "${BACKUP_DIR}/psyscale-${DATE}.dump" 2>/dev/null

# Dump SQL lisible (gzippe) en parallele pour restauration rapide
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE" 2>/dev/null

# Verifier que le backup n'est pas vide
DUMP_SIZE=$(stat -c%s "${BACKUP_DIR}/psyscale-${DATE}.dump" 2>/dev/null || echo "0")
GZ_SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")

if [ "$DUMP_SIZE" -lt 1000 ] || [ "$GZ_SIZE" -lt 500 ]; then
  echo "[$(date)] ERREUR: Backup trop petit (dump=${DUMP_SIZE}B, gz=${GZ_SIZE}B)"
  exit 1
fi

echo "[$(date)] Backup OK: ${BACKUP_FILE} (${GZ_SIZE} bytes)"
echo "[$(date)] Dump:      psyscale-${DATE}.dump (${DUMP_SIZE} bytes)"

# Rotation — supprimer les backups de plus de N jours
DELETED=$(find "$BACKUP_DIR" -name "psyscale-*.dump" -o -name "psyscale-*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
echo "[$(date)] Rotation: ${DELETED} anciens backups supprimes (>${RETENTION_DAYS} jours)"

# Lister les backups actuels
TOTAL=$(ls -1 "$BACKUP_DIR"/psyscale-*.dump 2>/dev/null | wc -l)
echo "[$(date)] Total backups: ${TOTAL} dumps conserves"

echo "[$(date)] Backup termine."
