#!/usr/bin/env bash
# =============================================================================
# Préparation d'un déploiement API — côté local (machine de dev)
# =============================================================================
# Génère le tarball build-ctx (exactement les fichiers dont le Dockerfile a
# besoin — build-ctx VPS partiel : apps/api seul) et le dépose dans
# apps/web/public/ pour le publier sur psylib.eu via un redeploy Vercel.
#
# Le tarball reflète l'état actuel du repo (pnpm-lock.yaml + manifests + source
# API + prisma) → reconstruction déterministe, pas de risque "fichier oublié"
# ni de désync `pnpm install --frozen-lockfile`.
#
# À lancer depuis la RACINE du repo :
#   bash docker/api-prod/prepare-deploy.sh
#
# Puis suivre les 3 étapes imprimées. Détails complets : docker/api-prod/DEPLOY.md
# =============================================================================
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

RAND=$(openssl rand -hex 3)
NAME="_apideploy-$(date +%Y%m%d)-${RAND}.tgz"
OUT="apps/web/public/${NAME}"

# Fichiers consommés par apps/api/Dockerfile (cf. ses COPY). Pas de node_modules
# ni dist (le Dockerfile installe + build). docker/api-prod/deploy.sh est inclus
# pour rester versionné dans le build-ctx du VPS.
tar czf "$OUT" \
  --exclude='node_modules' --exclude='dist' \
  --exclude='.turbo' --exclude='*.tsbuildinfo' \
  pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json tsconfig.base.json \
  packages \
  apps/api/package.json apps/api/tsconfig.json apps/api/nest-cli.json \
  apps/api/src apps/api/prisma \
  docker/api-prod/deploy.sh

MD5=$(md5sum "$OUT" | awk '{print $1}')
SIZE=$(du -h "$OUT" | awk '{print $1}')

cat <<EOF

────────────────────────────────────────────────────────────────────────────
 Tarball build-ctx prêt : $OUT  ($SIZE)
 MD5 : $MD5
────────────────────────────────────────────────────────────────────────────

 1) PUBLIER (depuis la racine) :
      npx vercel --prod --yes

 2) SUR LE VPS (bastion → psylib-papp01, en root) :
      /opt/psyscale-api/deploy.sh https://psylib.eu/${NAME} ${MD5}
    (ajouter --migrate uniquement si ce déploiement contient une migration Prisma)

 3) APRÈS SUCCÈS — nettoyer l'exposition publique :
      rm $OUT && npx vercel --prod --yes

 Bootstrap (1re fois seulement) + rollback + migrations : docker/api-prod/DEPLOY.md
────────────────────────────────────────────────────────────────────────────
EOF
