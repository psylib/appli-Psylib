#!/bin/bash
# Deploy n8n sur VPS OVH (51.178.31.68)
# Usage : bash deploy.sh

set -euo pipefail

VPS_IP="51.178.31.68"
VPS_USER="root"
REMOTE_DIR="/opt/n8n"

echo "=== Déploiement n8n sur $VPS_IP ==="

# 1. Créer le répertoire sur le VPS
echo "[1/6] Création du répertoire distant..."
ssh "$VPS_USER@$VPS_IP" "mkdir -p $REMOTE_DIR"

# 2. Copier les fichiers
echo "[2/6] Copie des fichiers..."
scp docker-compose.yml "$VPS_USER@$VPS_IP:$REMOTE_DIR/"
scp nginx.conf "$VPS_USER@$VPS_IP:/etc/nginx/sites-available/n8n.psylib.eu"

# 3. Générer le .env si inexistant
echo "[3/6] Configuration des variables d'environnement..."
ssh "$VPS_USER@$VPS_IP" bash -s <<'REMOTE'
cd /opt/n8n
if [ ! -f .env ]; then
  DB_PASS=$(openssl rand -hex 16)
  ENC_KEY=$(openssl rand -hex 32)
  cat > .env <<EOF
N8N_DB_PASSWORD=$DB_PASS
N8N_ENCRYPTION_KEY=$ENC_KEY
EOF
  echo "  -> .env généré avec des secrets aléatoires"
else
  echo "  -> .env existe déjà, skip"
fi
REMOTE

# 4. Certificat SSL Let's Encrypt
echo "[4/6] Certificat SSL pour n8n.psylib.eu..."
ssh "$VPS_USER@$VPS_IP" bash -s <<'REMOTE'
if [ ! -d /etc/letsencrypt/live/n8n.psylib.eu ]; then
  certbot certonly --nginx -d n8n.psylib.eu --non-interactive --agree-tos -m psylib.eu@gmail.com
  echo "  -> Certificat créé"
else
  echo "  -> Certificat existe déjà"
fi
REMOTE

# 5. Activer nginx + redémarrer
echo "[5/6] Activation nginx..."
ssh "$VPS_USER@$VPS_IP" bash -s <<'REMOTE'
ln -sf /etc/nginx/sites-available/n8n.psylib.eu /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "  -> nginx rechargé"
REMOTE

# 6. Lancer n8n
echo "[6/6] Démarrage n8n..."
ssh "$VPS_USER@$VPS_IP" "cd $REMOTE_DIR && docker compose up -d"

echo ""
echo "=== n8n déployé ! ==="
echo "URL : https://n8n.psylib.eu"
echo "Premier accès : créer un compte admin via l'interface web"
