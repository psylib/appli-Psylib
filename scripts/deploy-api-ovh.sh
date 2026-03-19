#!/bin/bash
set -euo pipefail

# PsyScale — Deploy API vers OVH VPS via SSH
# Usage: ./scripts/deploy-api-ovh.sh [IMAGE_TAG]
# Variables requises: OVH_API_VPS_HOST, OVH_API_VPS_USER, GHCR_USERNAME, GHCR_TOKEN

VPS_HOST="${OVH_API_VPS_HOST:?Variable OVH_API_VPS_HOST requise}"
VPS_USER="${OVH_API_VPS_USER:-ubuntu}"
GHCR_USERNAME="${GHCR_USERNAME:?Variable GHCR_USERNAME requise}"
GHCR_TOKEN="${GHCR_TOKEN:?Variable GHCR_TOKEN requise}"
GITHUB_REPO="${GITHUB_REPO:-psyscale}"
IMAGE_TAG="${1:-$(git rev-parse --short HEAD 2>/dev/null || echo latest)}"
DEPLOY_DIR="/opt/psyscale-api"

IMAGE="ghcr.io/${GHCR_USERNAME}/${GITHUB_REPO}-api:${IMAGE_TAG}"

echo "🚀 Deploy PsyScale API → OVH $VPS_HOST"
echo "   Image: $IMAGE"

# 1. Login GHCR + pull image + restart sur le VPS
ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" bash <<ENDSSH
set -euo pipefail

echo "🔑 Login GitHub Container Registry..."
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

echo "⬇️  Pull image ${IMAGE}..."
docker pull "${IMAGE}"

# Tagger en :latest localement
docker tag "${IMAGE}" "ghcr.io/${GHCR_USERNAME}/${GITHUB_REPO}-api:latest"

echo "🗄️  Migrations Prisma..."
cd ${DEPLOY_DIR}
IMAGE_TAG="${IMAGE_TAG}" docker compose run --rm --no-deps api \
  sh -c "npx prisma migrate deploy" 2>&1 || {
    echo "❌ Migration échouée"
    exit 1
  }

echo "🔄 Redémarrage API (zero-downtime)..."
IMAGE_TAG="${IMAGE_TAG}" docker compose up -d --no-deps --pull never api

echo "⏳ Attente démarrage API..."
for i in \$(seq 1 30); do
  if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ API opérationnelle !"
    break
  fi
  if [ \$i -eq 30 ]; then
    echo "❌ API ne répond pas après 30s"
    docker compose logs --tail=50 api
    exit 1
  fi
  sleep 2
done

echo "🧹 Nettoyage images anciennes..."
docker image prune -f --filter "until=24h"

docker logout ghcr.io
ENDSSH

echo ""
echo "✅ Deploy terminé — $IMAGE"
