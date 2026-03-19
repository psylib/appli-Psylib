#!/bin/bash
set -euo pipefail

# PsyScale — Ajout API sur le VPS Keycloak existant (51.178.31.68)
# Usage: ./scripts/setup-api-existing-vps.sh
# Prérequis: SSH configuré avec ~/.ssh/psyscale_ovh

VPS_HOST="51.178.31.68"
VPS_USER="ubuntu"
SSH_KEY="${HOME}/.ssh/psyscale_ovh"
DEPLOY_DIR="/opt/psyscale-api"
DOMAIN="api.psylib.eu"

SSH_CMD="ssh -i $SSH_KEY -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST"

echo "🚀 Setup PsyScale API sur VPS OVH existant ($VPS_HOST)"
echo ""

# ── 1. Créer répertoire deploy ───────────────────────────────────────────────
echo "📁 Création répertoire $DEPLOY_DIR..."
$SSH_CMD "sudo mkdir -p $DEPLOY_DIR && sudo chown ubuntu:ubuntu $DEPLOY_DIR"

# ── 2. Copier docker-compose.yml ─────────────────────────────────────────────
echo "📋 Copie docker-compose.yml..."
scp -i "$SSH_KEY" \
  docker/api-prod/docker-compose.yml \
  "$VPS_USER@$VPS_HOST:$DEPLOY_DIR/docker-compose.yml"

# ── 3. Créer .env sur le VPS ─────────────────────────────────────────────────
echo ""
echo "⚠️  ÉTAPE MANUELLE REQUISE — Créer le fichier .env sur le VPS :"
echo "   $SSH_CMD"
echo "   nano $DEPLOY_DIR/.env"
echo "   (Copier le contenu de docker/api-prod/.env.example et remplir les valeurs)"
echo ""
read -p "Appuyer sur Entrée une fois le .env créé sur le VPS..."

# ── 4. Configurer nginx pour api.psylib.eu ────────────────────────────────────
echo "🌐 Configuration nginx api.psylib.eu..."
scp -i "$SSH_KEY" \
  docker/api-prod/nginx.conf \
  "$VPS_USER@$VPS_HOST:/tmp/nginx-api-psylib.conf"

$SSH_CMD bash <<ENDSSH
set -euo pipefail

# Ajouter site nginx
sudo cp /tmp/nginx-api-psylib.conf /etc/nginx/sites-available/api.psylib.eu

# Activer si pas déjà fait
if [ ! -f /etc/nginx/sites-enabled/api.psylib.eu ]; then
  sudo ln -s /etc/nginx/sites-available/api.psylib.eu /etc/nginx/sites-enabled/api.psylib.eu
fi

sudo nginx -t
sudo systemctl reload nginx
echo "✅ nginx rechargé"
ENDSSH

# ── 5. Certificat TLS pour api.psylib.eu ─────────────────────────────────────
echo "🔒 Certificat TLS Let's Encrypt pour $DOMAIN..."
echo "   ⚠️  DNS doit déjà pointer : api.psylib.eu → $VPS_HOST"
read -p "Le DNS est configuré ? (o/N) " dns_ok
if [[ "$dns_ok" =~ ^[oOyY]$ ]]; then
  $SSH_CMD "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@psylib.eu"
  echo "✅ Certificat TLS obtenu"
else
  echo "⏭️  Cert TLS ignoré — lance manuellement :"
  echo "   $SSH_CMD 'sudo certbot --nginx -d $DOMAIN --agree-tos -m admin@psylib.eu'"
fi

# ── 6. Login GHCR ─────────────────────────────────────────────────────────────
echo ""
echo "🔑 Authentification GitHub Container Registry..."
echo "   Tu as besoin d'un GitHub PAT (Personal Access Token) avec 'read:packages'"
echo "   Créer sur : https://github.com/settings/tokens"
echo ""
read -p "GitHub username : " gh_user
read -s -p "GitHub PAT (read:packages) : " gh_token
echo ""

$SSH_CMD "echo '${gh_token}' | docker login ghcr.io -u '${gh_user}' --password-stdin"
echo "✅ Connecté à ghcr.io"

# ── 7. Premier lancement ──────────────────────────────────────────────────────
echo ""
echo "🐳 Premier lancement des containers..."
$SSH_CMD bash <<ENDSSH
set -euo pipefail
cd $DEPLOY_DIR

# Pull images
docker compose pull

# Démarrer PostgreSQL et Redis d'abord
docker compose up -d postgres redis

echo "⏳ Attente démarrage PostgreSQL (15s)..."
sleep 15

# Migrations Prisma
echo "🗄️  Migrations Prisma..."
docker compose run --rm --no-deps api \
  sh -c "npx prisma migrate deploy"

# Démarrer l'API
docker compose up -d api

echo "⏳ Attente démarrage API (30s)..."
for i in \$(seq 1 15); do
  if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ API opérationnelle !"
    break
  fi
  [ \$i -eq 15 ] && echo "⚠️  API pas encore up — vérifie: docker compose logs api"
  sleep 2
done

docker compose ps
ENDSSH

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Setup terminé !"
echo ""
echo "📌 Prochaines étapes :"
echo ""
echo "1. Ajouter secrets GitHub Actions (Settings → Secrets → Actions) :"
echo "   OVH_API_VPS_HOST     = $VPS_HOST"
echo "   OVH_API_VPS_USER     = ubuntu"
echo "   OVH_API_VPS_SSH_KEY  = \$(cat ~/.ssh/psyscale_ovh)"
echo ""
echo "2. Vérifier que l'API répond :"
echo "   curl https://$DOMAIN/health"
echo ""
echo "3. Mettre à jour les vars Vercel (NEXT_PUBLIC_API_URL) :"
echo "   NEXT_PUBLIC_API_URL = https://$DOMAIN"
echo "   NEXT_PUBLIC_WS_URL  = https://$DOMAIN"
echo "════════════════════════════════════════════════════════"
