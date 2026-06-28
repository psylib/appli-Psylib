#!/usr/bin/env bash
# =============================================================================
# Déploiement API PsyScale — VPS AZNetwork (psylib-papp01)
# =============================================================================
# Transforme la procédure manuelle (transfert tarball → build → recreate →
# smoke-test → rollback) en UNE commande idempotente avec rollback automatique.
#
# Emplacement canonique sur le VPS : /opt/psyscale-api/deploy.sh
# (placé une fois au bootstrap — voir DEPLOY.md).
#
# Usage :
#   ./deploy.sh <tarball-url> <md5-attendu> [--migrate]
#
#   <tarball-url>   URL publique du tarball build-ctx (généré par prepare-deploy.sh,
#                   hébergé sur psylib.eu via un redeploy Vercel)
#   <md5-attendu>   md5 imprimé par prepare-deploy.sh (intégrité du transfert)
#   --migrate       (optionnel) lance `prisma migrate deploy` AVANT le recreate
#                   — uniquement si le déploiement contient une nouvelle migration
#
# Sécurités :
#   - vérif md5 (transfert corrompu → abort, aucun impact service)
#   - build hors-ligne (l'ancien conteneur tourne pendant le build)
#   - backup build-ctx + capture de l'image courante AVANT bascule
#   - smoke-test health après recreate → ROLLBACK AUTO si KO
# =============================================================================
set -euo pipefail

URL="${1:?usage: deploy.sh <tarball-url> <md5> [--migrate]}"
MD5="${2:?md5 attendu requis (cf. sortie de prepare-deploy.sh)}"
MIGRATE="${3:-}"

APP_DIR=/opt/psyscale-api
CTX="$APP_DIR/build-ctx"
TS=$(date +%Y%m%d-%H%M%S)
TMP="/tmp/apideploy-$TS.tgz"
HEALTH="http://localhost:4000/api/v1/health"

log() { echo "==> $*"; }

cd "$APP_DIR"

log "[1/7] Téléchargement + vérification md5"
curl -fsS "$URL" -o "$TMP"
GOT=$(md5sum "$TMP" | awk '{print $1}')
if [ "$GOT" != "$MD5" ]; then
  echo "!! md5 incohérent (attendu $MD5, obtenu $GOT) — transfert corrompu, abandon." >&2
  rm -f "$TMP"; exit 1
fi

log "[2/7] Sauvegarde build-ctx + capture image de rollback"
OLD_IMG=$(docker image inspect psyscale-api:latest --format '{{.Id}}' 2>/dev/null || echo "")
echo "${OLD_IMG}" > "$APP_DIR/.rollback-image"
tar czf "$APP_DIR/build-ctx.bak-$TS.tgz" --exclude='*.bak-*' -C "$CTX" .
echo "    image rollback : ${OLD_IMG:-<aucune>}"
echo "    backup ctx     : $APP_DIR/build-ctx.bak-$TS.tgz"

log "[3/7] Extraction de la nouvelle source dans build-ctx"
tar -xzf "$TMP" -C "$CTX"

log "[4/7] docker build (l'API tourne toujours sur l'ancienne image)"
docker build -t psyscale-api:latest "$CTX"

if [ "$MIGRATE" = "--migrate" ]; then
  log "[4b] prisma migrate deploy"
  docker compose run --rm api npx prisma migrate deploy
fi

log "[5/7] Recreate du conteneur api"
docker compose up -d --force-recreate api

log "[6/7] Smoke-test health (≤30s)"
ok=0
for _ in $(seq 1 15); do
  sleep 2
  if curl -fsS "$HEALTH" >/dev/null 2>&1; then ok=1; break; fi
done

if [ "$ok" != "1" ]; then
  echo "!! HEALTH KO — ROLLBACK AUTOMATIQUE" >&2
  if [ -n "$OLD_IMG" ]; then
    docker tag "$OLD_IMG" psyscale-api:latest
    docker compose up -d --force-recreate api
    echo "Rollback vers $OLD_IMG effectué. Logs : docker compose logs --tail=80 api" >&2
  else
    echo "Aucune image de rollback connue. Restaure build-ctx.bak-$TS.tgz + rebuild." >&2
  fi
  rm -f "$TMP"; exit 1
fi

log "[7/7] OK — health 200. Déploiement réussi."
rm -f "$TMP"
echo "    Rollback manuel si besoin :"
echo "      docker tag ${OLD_IMG} psyscale-api:latest && cd $APP_DIR && docker compose up -d --force-recreate api"
echo "    (l'image de rollback est aussi notée dans $APP_DIR/.rollback-image)"
