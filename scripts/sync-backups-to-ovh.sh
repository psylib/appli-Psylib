#!/bin/bash
set -euo pipefail

# PsyScale — Sync backups locaux vers OVH Object Storage (cross-cloud HDS)
# Usage: ./scripts/sync-backups-to-ovh.sh
#
# Utilise rclone (binaire leger, installe via `apt install rclone`)
# Config attendue dans /etc/rclone-psyscale.conf (ou OVH_S3_* env vars).
#
# Variables d'environnement requises:
#   OVH_S3_ENDPOINT       ex: https://s3.gra.io.cloud.ovh.net
#   OVH_S3_ACCESS_KEY_ID
#   OVH_S3_SECRET_ACCESS_KEY
#   OVH_S3_REGION         ex: gra
#   OVH_S3_BUCKET         ex: psyscale-backups-prod
#
# Retention: 90 jours cote OVH (vs 30 local)

BACKUP_DIR="${BACKUP_DIR:-/opt/psyscale-backups}"
RCLONE_REMOTE="ovh-psyscale"
OVH_BUCKET="${OVH_S3_BUCKET:-psyscale-backups-prod}"
RETENTION_DAYS=90
LOG_FILE="/var/log/psyscale-backup.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [sync-ovh] $*"
}

# Verifier que rclone est installe
if ! command -v rclone >/dev/null 2>&1; then
  log "ERREUR: rclone non installe. Lancer: sudo apt install rclone"
  exit 1
fi

# Verifier les env vars
: "${OVH_S3_ENDPOINT:?OVH_S3_ENDPOINT manquant}"
: "${OVH_S3_ACCESS_KEY_ID:?OVH_S3_ACCESS_KEY_ID manquant}"
: "${OVH_S3_SECRET_ACCESS_KEY:?OVH_S3_SECRET_ACCESS_KEY manquant}"
: "${OVH_S3_REGION:?OVH_S3_REGION manquant}"

# Configuration inline rclone (via env vars, pas de fichier config)
export RCLONE_CONFIG_OVH_PSYSCALE_TYPE="s3"
export RCLONE_CONFIG_OVH_PSYSCALE_PROVIDER="Other"
export RCLONE_CONFIG_OVH_PSYSCALE_ENDPOINT="${OVH_S3_ENDPOINT}"
export RCLONE_CONFIG_OVH_PSYSCALE_ACCESS_KEY_ID="${OVH_S3_ACCESS_KEY_ID}"
export RCLONE_CONFIG_OVH_PSYSCALE_SECRET_ACCESS_KEY="${OVH_S3_SECRET_ACCESS_KEY}"
export RCLONE_CONFIG_OVH_PSYSCALE_REGION="${OVH_S3_REGION}"

log "Demarrage sync vers ${RCLONE_REMOTE}:${OVH_BUCKET}"

# Copier les backups des dernieres 24h pour eviter de re-uploader l'historique
# rclone copy est idempotent (skip si deja present)
if ! rclone copy "${BACKUP_DIR}/" "${RCLONE_REMOTE}:${OVH_BUCKET}/" \
  --include "psyscale-*.dump" \
  --include "psyscale-*.sql.gz" \
  --include "keycloak/keycloak-*.sql.gz" \
  --max-age 48h \
  --s3-no-check-bucket \
  --stats 0 \
  2>&1 | tee -a "${LOG_FILE}"; then
  log "ERREUR: rclone copy a echoue"
  exit 1
fi

# Retention cote OVH : supprimer les fichiers de plus de N jours
if ! rclone delete "${RCLONE_REMOTE}:${OVH_BUCKET}/" \
  --min-age "${RETENTION_DAYS}d" \
  --s3-no-check-bucket \
  --stats 0 \
  2>&1 | tee -a "${LOG_FILE}"; then
  log "WARN: rclone delete (retention) a echoue — non-fatal"
fi

log "Sync termine avec succes"
exit 0
