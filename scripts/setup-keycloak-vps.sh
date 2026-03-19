#!/bin/bash
# ============================================================
# PsyScale — Setup Keycloak sur VPS OVH
# Usage : bash scripts/setup-keycloak-vps.sh
#
# Pré-requis AVANT d'exécuter ce script :
#   1. DNS : auth.psylib.eu → 51.178.31.68 (TTL 300)
#   2. Avoir les clés SSH pour ubuntu@vps-37348db5.vps.ovh.net
# ============================================================
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────
VPS_HOST="vps-37348db5.vps.ovh.net"
VPS_USER="ubuntu"
VPS_PORT="22"
REMOTE_DIR="/opt/psyscale-keycloak"
DOMAIN="auth.psylib.eu"
EMAIL="admin@psylib.eu"   # ← Change si besoin (Let's Encrypt)

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${GREEN}══${NC} $1"; }

# ─── Vérifications locales ───────────────────────────────────
step "Vérifications locales"

[[ -f "docker/keycloak-prod/docker-compose.yml" ]] || fail "Lancer depuis la racine du projet PsyFlow"
[[ -f "docker/keycloak-prod/nginx.conf" ]]          || fail "nginx.conf manquant"
[[ -f "docker/keycloak-prod/realm/psyscale-realm.json" ]] || fail "realm JSON manquant"

command -v ssh  >/dev/null || fail "ssh non installé"
command -v scp  >/dev/null || fail "scp non installé"

ok "Fichiers locaux OK"

# ─── Test connexion SSH ──────────────────────────────────────
step "Test connexion SSH"
ssh -o ConnectTimeout=10 -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "echo 'SSH OK'" || \
  fail "Impossible de se connecter au VPS. Vérifier les clés SSH."
ok "Connexion SSH OK"

# ─── Génération .env Keycloak ────────────────────────────────
step "Génération des secrets Keycloak"

ENV_FILE="docker/keycloak-prod/.env"
if [[ -f "$ENV_FILE" ]]; then
  warn ".env déjà présent — on le réutilise"
else
  # Génération de mots de passe aléatoires sécurisés
  KC_DB_PASS=$(openssl rand -base64 32 | tr -d '=/+' | head -c 32)
  KC_ADMIN_PASS=$(openssl rand -base64 32 | tr -d '=/+' | head -c 24)

  cat > "$ENV_FILE" <<EOF
# PsyScale — Keycloak Production Secrets
# GARDEZ CE FICHIER SÉCURISÉ — NE PAS COMMITTER

KC_DB_PASSWORD=${KC_DB_PASS}
KC_ADMIN_USER=admin
KC_ADMIN_PASSWORD=${KC_ADMIN_PASS}
EOF

  ok ".env créé : $ENV_FILE"
  warn "IMPORTANT — Notez ces credentials :"
  echo "  Admin URL : https://${DOMAIN}/admin"
  echo "  Login     : admin"
  echo "  Password  : ${KC_ADMIN_PASS}"
  echo ""
  warn "Ces infos sont aussi dans docker/keycloak-prod/.env (NE PAS COMMITTER)"
fi

# ─── Setup serveur distant ───────────────────────────────────
step "Installation Docker + dépendances sur le VPS"

ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" bash <<'REMOTE_SETUP'
set -euo pipefail

echo "→ Mise à jour apt..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq

echo "→ Installation Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sudo bash
  sudo usermod -aG docker ubuntu
  echo "  Docker installé"
else
  echo "  Docker déjà installé : $(docker --version)"
fi

echo "→ Installation nginx + certbot..."
sudo apt-get install -y -qq nginx certbot python3-certbot-nginx ufw

echo "→ Configuration pare-feu UFW..."
sudo ufw allow 22/tcp   comment 'SSH'    2>/dev/null || true
sudo ufw allow 80/tcp   comment 'HTTP'   2>/dev/null || true
sudo ufw allow 443/tcp  comment 'HTTPS'  2>/dev/null || true
sudo ufw --force enable
echo "  UFW activé"

echo "→ Création répertoire /opt/psyscale-keycloak..."
sudo mkdir -p /opt/psyscale-keycloak/realm
sudo chown -R ubuntu:ubuntu /opt/psyscale-keycloak

echo "→ Setup terminé"
REMOTE_SETUP

ok "Dépendances installées"

# ─── Copie des fichiers ──────────────────────────────────────
step "Copie des fichiers sur le VPS"

scp -P "$VPS_PORT" "docker/keycloak-prod/docker-compose.yml" \
  "$VPS_USER@$VPS_HOST:/opt/psyscale-keycloak/docker-compose.yml"

scp -P "$VPS_PORT" "docker/keycloak-prod/nginx.conf" \
  "$VPS_USER@$VPS_HOST:/opt/psyscale-keycloak/nginx.conf"

scp -P "$VPS_PORT" "docker/keycloak-prod/.env" \
  "$VPS_USER@$VPS_HOST:/opt/psyscale-keycloak/.env"

scp -P "$VPS_PORT" "docker/keycloak-prod/realm/psyscale-realm.json" \
  "$VPS_USER@$VPS_HOST:/opt/psyscale-keycloak/realm/psyscale-realm.json"

ok "Fichiers copiés"

# ─── Certificat Let's Encrypt ────────────────────────────────
step "Certificat TLS Let's Encrypt pour ${DOMAIN}"

ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" bash <<REMOTE_CERT
set -euo pipefail

DOMAIN="${DOMAIN}"
EMAIL="${EMAIL}"

# Arrêter nginx si actif (certbot standalone a besoin du port 80)
sudo systemctl stop nginx 2>/dev/null || true

# Vérifier que le domaine pointe bien vers ce serveur
RESOLVED_IP=\$(dig +short "\$DOMAIN" 2>/dev/null | tail -1 || true)
SERVER_IP=\$(curl -s ifconfig.me 2>/dev/null || echo "unknown")

if [[ "\$RESOLVED_IP" != "\$SERVER_IP" ]]; then
  echo "⚠  ATTENTION : \${DOMAIN} résout sur \${RESOLVED_IP:-non résolu}"
  echo "   Ce serveur a l'IP : \$SERVER_IP"
  echo "   Configurez votre DNS avant de continuer (TTL peut prendre ~5 min)"
  echo "   On continue quand même avec --staging pour tester..."
  STAGING="--staging"
else
  echo "  DNS OK : \${DOMAIN} → \${RESOLVED_IP}"
  STAGING=""
fi

if [[ ! -f "/etc/letsencrypt/live/\${DOMAIN}/fullchain.pem" ]]; then
  sudo certbot certonly --standalone \
    -d "\$DOMAIN" \
    --email "\$EMAIL" \
    --agree-tos \
    --non-interactive \
    \$STAGING || {
    echo "⚠  Certbot échoué. Créer un cert auto-signé temporaire..."
    sudo mkdir -p /etc/letsencrypt/live/\${DOMAIN}
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/letsencrypt/live/\${DOMAIN}/privkey.pem \
      -out /etc/letsencrypt/live/\${DOMAIN}/fullchain.pem \
      -subj "/CN=\${DOMAIN}" 2>/dev/null
    echo "  Cert auto-signé créé (temporaire — remplacer avec Let's Encrypt une fois DNS OK)"
  }
else
  echo "  Certificat déjà présent"
fi

# Renouvellement automatique
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") \
  | sort -u | crontab -
echo "  Renouvellement auto configuré (cron 3h)"
REMOTE_CERT

ok "Certificat TLS configuré"

# ─── Configuration nginx ─────────────────────────────────────
step "Configuration nginx"

ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" bash <<'REMOTE_NGINX'
set -euo pipefail

# Copier la config nginx
sudo cp /opt/psyscale-keycloak/nginx.conf /etc/nginx/nginx.conf

# Tester la config
sudo nginx -t && echo "  nginx config OK"

# Activer + démarrer nginx
sudo systemctl enable nginx
sudo systemctl restart nginx
echo "  nginx démarré"
REMOTE_NGINX

ok "nginx configuré"

# ─── Démarrage Keycloak ──────────────────────────────────────
step "Démarrage Keycloak (Docker Compose)"

ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" bash <<'REMOTE_KC'
set -euo pipefail

cd /opt/psyscale-keycloak

# Nouvelle session docker (group refresh)
newgrp docker <<'DOCKER_CMD'
docker compose pull
docker compose up -d

echo "  Attente démarrage Keycloak (peut prendre 2-3 min au 1er boot)..."
for i in {1..30}; do
  if curl -sf http://localhost:8080/health/ready &>/dev/null; then
    echo "  ✓ Keycloak est UP"
    exit 0
  fi
  echo "  ... attente $((i * 10))s"
  sleep 10
done
echo "  ⚠ Keycloak pas encore prêt — voir les logs : docker compose logs keycloak"
DOCKER_CMD
REMOTE_KC

ok "Keycloak démarré"

# ─── Vérification finale ─────────────────────────────────────
step "Vérification finale"

ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" bash <<REMOTE_CHECK
echo "→ Statut containers :"
cd /opt/psyscale-keycloak && docker compose ps

echo ""
echo "→ Test health Keycloak :"
curl -sf http://localhost:8080/health/ready && echo "HTTP health: OK" || echo "HTTP health: KO"

echo ""
echo "→ Test HTTPS (peut échouer si cert staging) :"
curl -skf https://localhost/health/ready && echo "HTTPS health: OK" || echo "HTTPS health: KO (normal avec cert staging)"
REMOTE_CHECK

# ─── Résumé ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✓ Setup Keycloak terminé${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo "  Admin Console : https://${DOMAIN}/admin"
echo "  OIDC Discovery: https://${DOMAIN}/realms/psyscale/.well-known/openid-configuration"
echo ""
echo "  Credentials → voir : docker/keycloak-prod/.env"
echo ""
warn "Prochaines étapes :"
echo "  1. Vérifier que DNS auth.psylib.eu → 51.178.31.68 est propagé"
echo "  2. Accéder à l'admin console et vérifier le realm 'psyscale'"
echo "  3. Configurer les clients OIDC (psyscale-app, psyscale-admin)"
echo "  4. Mettre KEYCLOAK_URL=https://${DOMAIN} dans les env vars Vercel + AWS"
echo ""
