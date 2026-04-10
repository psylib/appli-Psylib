#!/bin/bash
set -euo pipefail

# PsyScale — Installation du cron de backup automatique
# Usage: ./scripts/install-backup-cron.sh
#
# Idempotent — detecte les entrees existantes avant d'ajouter.
# Cree les fichiers de log avec les bonnes permissions.
#
# Cron installe:
#   0 2 * * *   backup-postgres.sh
#   0 3 * * *   backup-keycloak-db.sh
#   0 4 * * 0   restore-postgres.sh --verify (dimanche 4h)

SCRIPTS_DIR="${SCRIPTS_DIR:-/opt/psyscale-api/scripts}"
LOG_FILE="/var/log/psyscale-backup.log"
LOG_KEYCLOAK="/var/log/keycloak-backup.log"
LOG_RESTORE="/var/log/psyscale-restore-verify.log"

log() {
  echo "[install-backup-cron] $*"
}

# ── Creation des fichiers de log ─────────────────────────────────────────────
for LOG in "$LOG_FILE" "$LOG_KEYCLOAK" "$LOG_RESTORE"; do
  if [ ! -f "$LOG" ]; then
    sudo touch "$LOG"
    sudo chown ubuntu:ubuntu "$LOG"
    sudo chmod 644 "$LOG"
    log "Cree $LOG"
  fi
done

# ── Lignes cron a installer ──────────────────────────────────────────────────
CRON_BACKUP_PG="0 2 * * * ${SCRIPTS_DIR}/backup-postgres.sh >> ${LOG_FILE} 2>&1"
CRON_BACKUP_KC="0 3 * * * ${SCRIPTS_DIR}/backup-keycloak-db.sh >> ${LOG_KEYCLOAK} 2>&1"
CRON_VERIFY="0 4 * * 0 ${SCRIPTS_DIR}/restore-postgres.sh --verify >> ${LOG_RESTORE} 2>&1"

# ── Installation idempotente ─────────────────────────────────────────────────
TMP_CRON=$(mktemp)
crontab -l 2>/dev/null > "$TMP_CRON" || true

ADDED=0

add_if_missing() {
  local line="$1"
  local marker="$2"
  if ! grep -Fq "$marker" "$TMP_CRON"; then
    echo "$line" >> "$TMP_CRON"
    ADDED=$((ADDED + 1))
    log "+ $marker"
  else
    log "= $marker (deja present)"
  fi
}

add_if_missing "$CRON_BACKUP_PG" "backup-postgres.sh"
add_if_missing "$CRON_BACKUP_KC" "backup-keycloak-db.sh"
add_if_missing "$CRON_VERIFY" "restore-postgres.sh --verify"

if [ "$ADDED" -gt 0 ]; then
  crontab "$TMP_CRON"
  log "Crontab mis a jour ($ADDED nouvelles entrees)"
else
  log "Crontab inchange (tout deja installe)"
fi

rm -f "$TMP_CRON"

# ── Resume ───────────────────────────────────────────────────────────────────
echo ""
log "Crontab actuel:"
crontab -l | grep -E "psyscale|keycloak|restore" || log "(aucune entree psyscale trouvee)"
echo ""
log "Logs:"
log "  - PostgreSQL backups: ${LOG_FILE}"
log "  - Keycloak backups:   ${LOG_KEYCLOAK}"
log "  - Restore verify:     ${LOG_RESTORE}"
echo ""
log "Installation terminee."
