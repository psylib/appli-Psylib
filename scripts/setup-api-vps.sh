#!/bin/bash
set -euo pipefail

# PsyScale — Setup VPS OVH HDS pour l'API NestJS
# Usage: ./scripts/setup-api-vps.sh <VPS_IP>
# Prérequis: VPS Ubuntu 22.04 HDS, accès SSH root/ubuntu

VPS_IP="${1:-}"
VPS_USER="ubuntu"
DEPLOY_DIR="/opt/psyscale-api"
DOMAIN="api.psylib.eu"

if [[ -z "$VPS_IP" ]]; then
  echo "Usage: $0 <VPS_IP>"
  exit 1
fi

echo "🚀 Setup PsyScale API VPS — $VPS_IP"
echo "   Domaine : $DOMAIN"

ssh "$VPS_USER@$VPS_IP" bash <<'ENDSSH'
set -euo pipefail

echo "📦 Mise à jour système..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

echo "🐳 Installation Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sudo bash
  sudo usermod -aG docker ubuntu
  sudo systemctl enable docker
  sudo systemctl start docker
fi

echo "📦 Installation nginx + certbot..."
sudo apt-get install -y nginx certbot python3-certbot-nginx ufw

echo "🔥 Configuration firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "📁 Création répertoire deploy..."
sudo mkdir -p /opt/psyscale-api
sudo chown ubuntu:ubuntu /opt/psyscale-api

echo "🔑 Authentification GitHub Container Registry..."
echo "   → Lance 'echo GHCR_TOKEN | docker login ghcr.io -u USERNAME --password-stdin' après setup"

echo "✅ Setup terminé !"
ENDSSH

echo ""
echo "📋 Étapes suivantes :"
echo ""
echo "1. Configurer DNS OVH :"
echo "   A  api  →  $VPS_IP"
echo ""
echo "2. Copier la config nginx :"
echo "   scp docker/api-prod/nginx.conf $VPS_USER@$VPS_IP:/tmp/nginx-api.conf"
echo "   ssh $VPS_USER@$VPS_IP 'sudo cp /tmp/nginx-api.conf /etc/nginx/sites-available/api.psylib.eu'"
echo "   ssh $VPS_USER@$VPS_IP 'sudo ln -sf /etc/nginx/sites-available/api.psylib.eu /etc/nginx/sites-enabled/'"
echo "   ssh $VPS_USER@$VPS_IP 'sudo nginx -t && sudo systemctl reload nginx'"
echo ""
echo "3. Obtenir certificat TLS :"
echo "   ssh $VPS_USER@$VPS_IP 'sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@psylib.eu'"
echo ""
echo "4. Copier les fichiers Docker :"
echo "   scp docker/api-prod/docker-compose.yml $VPS_USER@$VPS_IP:$DEPLOY_DIR/"
echo "   scp docker/api-prod/.env.example $VPS_USER@$VPS_IP:$DEPLOY_DIR/.env"
echo "   → Éditer $DEPLOY_DIR/.env avec les vraies valeurs"
echo ""
echo "5. Ajouter les secrets GitHub Actions :"
echo "   OVH_API_VPS_HOST = $VPS_IP"
echo "   OVH_API_VPS_USER = ubuntu"
echo "   OVH_API_VPS_SSH_KEY = (clé SSH privée)"
echo "   GHCR_USERNAME = (ton GitHub username)"
echo "   GHCR_TOKEN = (GitHub PAT avec read:packages)"
echo "   DATABASE_URL = (pour les migrations)"
echo ""
echo "6. Premier lancement manuel :"
echo "   ssh $VPS_USER@$VPS_IP"
echo "   cd $DEPLOY_DIR"
echo "   docker compose pull"
echo "   docker compose up -d"
echo "   docker compose exec -T api npx prisma migrate deploy"
echo ""
echo "✅ VPS API prêt pour le premier deploy !"
