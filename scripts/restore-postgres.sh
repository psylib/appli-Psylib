#!/bin/bash
set -euo pipefail

# PsyScale — Restore PostgreSQL depuis un dump
# Usage:
#   ./scripts/restore-postgres.sh <dump-file>   # Mode manuel: restore vers DB cible
#   ./scripts/restore-postgres.sh --verify      # Mode verification: test restore dans un container temporaire
#
# Le mode --verify est utilise par le cron hebdo pour garantir que les backups sont recuperables.
# Il ne touche JAMAIS la DB de production.

BACKUP_DIR="${BACKUP_DIR:-/opt/psyscale-backups}"
CONTAINER_NAME="${CONTAINER_NAME:-psyscale-api-postgres-1}"
DB_USER="${POSTGRES_USER:-psyscale}"
DB_NAME="${POSTGRES_DB:-psyscale}"

# Tables critiques a verifier
CRITICAL_TABLES=("users" "psychologists" "patients" "sessions" "audit_logs")

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [restore] $*"
}

# ── MODE VERIFY ──────────────────────────────────────────────────────────────
if [ "${1:-}" = "--verify" ]; then
  log "Mode VERIFY — test d'integrite d'un backup recent"

  # Trouver le dernier dump
  LATEST_DUMP=$(ls -t "${BACKUP_DIR}"/psyscale-*.dump 2>/dev/null | head -n 1 || true)
  if [ -z "$LATEST_DUMP" ]; then
    log "ERREUR: Aucun dump trouve dans ${BACKUP_DIR}"
    exit 1
  fi
  log "Dump cible: $LATEST_DUMP ($(stat -c%s "$LATEST_DUMP") bytes)"

  # Container temporaire
  TEST_CONTAINER="psyscale-restore-verify-$$"
  TEST_DB="psyscale_verify"
  TEST_PASSWORD="verify_pwd_$(date +%s)"

  log "Demarrage container test: $TEST_CONTAINER"
  docker run -d --rm \
    --name "$TEST_CONTAINER" \
    -e POSTGRES_PASSWORD="$TEST_PASSWORD" \
    -e POSTGRES_DB="$TEST_DB" \
    -e POSTGRES_USER="$DB_USER" \
    postgres:16-alpine >/dev/null

  # Attendre que Postgres soit pret
  sleep 5
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if docker exec "$TEST_CONTAINER" pg_isready -U "$DB_USER" >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done

  # Cleanup handler en cas d'erreur
  trap 'docker kill "$TEST_CONTAINER" >/dev/null 2>&1 || true' EXIT INT TERM

  # Restore du dump
  log "Restore en cours..."
  if ! docker exec -i "$TEST_CONTAINER" pg_restore \
      -U "$DB_USER" -d "$TEST_DB" --clean --if-exists --no-owner < "$LATEST_DUMP" 2>/dev/null; then
    log "WARN: pg_restore a emis des warnings (non-fatal)"
  fi

  # Verifier les tables critiques
  FAILED=0
  for table in "${CRITICAL_TABLES[@]}"; do
    COUNT=$(docker exec "$TEST_CONTAINER" psql -U "$DB_USER" -d "$TEST_DB" -tAc \
      "SELECT to_regclass('public.${table}');" 2>/dev/null || echo "")
    if [ -z "$COUNT" ] || [ "$COUNT" = "" ]; then
      log "KO: table '${table}' manquante"
      FAILED=$((FAILED + 1))
    else
      ROWS=$(docker exec "$TEST_CONTAINER" psql -U "$DB_USER" -d "$TEST_DB" -tAc \
        "SELECT count(*) FROM ${table};" 2>/dev/null || echo "?")
      log "OK: ${table} (${ROWS} lignes)"
    fi
  done

  # Cleanup
  docker kill "$TEST_CONTAINER" >/dev/null 2>&1 || true
  trap - EXIT INT TERM

  if [ "$FAILED" -gt 0 ]; then
    log "ERREUR: ${FAILED} tables critiques manquantes — backup NON-VERIFIABLE"
    exit 1
  fi

  log "SUCCESS: toutes les ${#CRITICAL_TABLES[@]} tables critiques presentes"
  exit 0
fi

# ── MODE MANUEL — restore vers la DB cible ──────────────────────────────────
DUMP_FILE="${1:-}"
if [ -z "$DUMP_FILE" ]; then
  echo "Usage:"
  echo "  $0 <dump-file>   # Restore manuel vers DB cible"
  echo "  $0 --verify      # Test d'integrite hebdo (container temporaire)"
  exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
  log "ERREUR: Fichier non trouve: $DUMP_FILE"
  exit 1
fi

log "ATTENTION — restore manuel vers $DB_NAME sur $CONTAINER_NAME"
log "Fichier: $DUMP_FILE"
read -p "Confirmer (tapez 'RESTORE' en majuscules): " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  log "Annule"
  exit 1
fi

log "Restore en cours..."
docker exec -i "$CONTAINER_NAME" pg_restore \
  -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner < "$DUMP_FILE"

log "Restore termine."
