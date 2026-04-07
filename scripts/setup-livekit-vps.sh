#!/bin/bash
set -euo pipefail

# PsyScale — Déploiement LiveKit sur VPS OVH existant (51.178.31.68)
# Usage: ./scripts/setup-livekit-vps.sh
# Prérequis: SSH configuré, DNS video.psylib.eu → 51.178.31.68

VPS_HOST="51.178.31.68"
VPS_USER="ubuntu"
SSH_KEY="${HOME}/.ssh/psyscale_ovh"
DEPLOY_DIR="/opt/livekit"
DOMAIN="video.psylib.eu"

SSH_CMD="ssh -i $SSH_KEY -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST"

echo "🎥 Setup LiveKit sur VPS OVH ($VPS_HOST)"
echo ""

# ── 1. Générer les clés LiveKit ────────────────────────────────────────────
echo "🔑 Génération des clés API LiveKit..."
echo "   Lance cette commande localement ou sur le VPS :"
echo "   docker run --rm livekit/generate"
echo ""
read -p "API Key (ex: APIxxxxxxxx) : " LK_API_KEY
read -p "API Secret (ex: base64...) : " LK_API_SECRET
echo ""

# ── 2. Créer répertoire deploy ─────────────────────────────────────────────
echo "📁 Création répertoire $DEPLOY_DIR..."
$SSH_CMD "sudo mkdir -p $DEPLOY_DIR && sudo chown ubuntu:ubuntu $DEPLOY_DIR"

# ── 3. Créer livekit.yaml avec les vraies clés ────────────────────────────
echo "📋 Création livekit.yaml avec les clés..."
cat > /tmp/livekit.yaml <<YAMLEOF
port: 7880
bind_addresses:
  - ""
rtc:
  udp_port: 7881
  port_range_start: 50000
  port_range_end: 50200
  use_external_ip: true
redis:
  address: localhost:6379
keys:
  ${LK_API_KEY}: ${LK_API_SECRET}
turn:
  enabled: true
  domain: ${DOMAIN}
  tls_port: 7882
room:
  empty_timeout: 300
logging:
  level: info
YAMLEOF

scp -i "$SSH_KEY" /tmp/livekit.yaml "$VPS_USER@$VPS_HOST:$DEPLOY_DIR/livekit.yaml"
rm /tmp/livekit.yaml

# ── 4. Copier docker-compose.yml ───────────────────────────────────────────
echo "📋 Copie docker-compose.yml..."
scp -i "$SSH_KEY" \
  docker/livekit/docker-compose.yml \
  "$VPS_USER@$VPS_HOST:$DEPLOY_DIR/docker-compose.yml"

# ── 5. Configurer nginx pour video.psylib.eu ───────────────────────────────
echo "🌐 Configuration nginx $DOMAIN..."
scp -i "$SSH_KEY" \
  docker/livekit/nginx.conf \
  "$VPS_USER@$VPS_HOST:/tmp/nginx-video-psylib.conf"

$SSH_CMD bash <<ENDSSH
set -euo pipefail

sudo cp /tmp/nginx-video-psylib.conf /etc/nginx/sites-available/$DOMAIN

if [ ! -f /etc/nginx/sites-enabled/$DOMAIN ]; then
  sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
fi

sudo nginx -t
sudo systemctl reload nginx
echo "✅ nginx rechargé"
ENDSSH

# ── 6. Certificat TLS pour video.psylib.eu ─────────────────────────────────
echo ""
echo "🔒 Certificat TLS Let's Encrypt pour $DOMAIN..."
echo "   ⚠️  DNS doit déjà pointer : $DOMAIN → $VPS_HOST"
read -p "Le DNS est configuré ? (o/N) " dns_ok
if [[ "$dns_ok" =~ ^[oOyY]$ ]]; then
  $SSH_CMD "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@psylib.eu"
  echo "✅ Certificat TLS obtenu"
else
  echo "⏭️  Cert TLS ignoré — lance manuellement :"
  echo "   $SSH_CMD 'sudo certbot --nginx -d $DOMAIN --agree-tos -m admin@psylib.eu'"
fi

# ── 7. Ouvrir les ports firewall (UDP WebRTC) ─────────────────────────────
echo ""
echo "🔥 Configuration firewall..."
$SSH_CMD bash <<ENDSSH
set -euo pipefail

# LiveKit TURN TLS
sudo ufw allow 7882/tcp comment "LiveKit TURN TLS"

# LiveKit RTC UDP
sudo ufw allow 7881/udp comment "LiveKit RTC UDP"

# LiveKit media range
sudo ufw allow 50000:50200/udp comment "LiveKit media UDP"

echo "✅ Firewall configuré"
sudo ufw status numbered | grep -i "livekit\|7881\|7882\|50000"
ENDSSH

# ── 8. Démarrer LiveKit ───────────────────────────────────────────────────
echo ""
echo "🐳 Démarrage LiveKit..."
$SSH_CMD bash <<ENDSSH
set -euo pipefail
cd $DEPLOY_DIR

docker compose up -d

echo "⏳ Attente démarrage LiveKit (10s)..."
for i in \$(seq 1 10); do
  if curl -sf http://localhost:7880 > /dev/null 2>&1; then
    echo "✅ LiveKit opérationnel !"
    break
  fi
  [ \$i -eq 10 ] && echo "⚠️  LiveKit pas encore up — vérifie: docker compose logs livekit"
  sleep 1
done

docker compose ps
ENDSSH

# ── 9. Ajouter variables LiveKit au .env de l'API ─────────────────────────
echo ""
echo "📝 Ajout des variables LiveKit au .env de l'API..."
$SSH_CMD bash <<ENDSSH
set -euo pipefail

API_ENV="/opt/psyscale-api/.env"

# Vérifier que le .env existe
if [ ! -f "\$API_ENV" ]; then
  echo "⚠️  \$API_ENV introuvable ! Ajoute manuellement les vars LiveKit."
  exit 0
fi

# Ajouter les vars si pas déjà présentes
if ! grep -q "LIVEKIT_API_KEY" "\$API_ENV"; then
  cat >> "\$API_ENV" <<ENVEOF

# ── LiveKit Video (visio HDS) ──────────────────────────────────────────────
LIVEKIT_API_KEY=${LK_API_KEY}
LIVEKIT_API_SECRET=${LK_API_SECRET}
LIVEKIT_WS_URL=wss://${DOMAIN}
LIVEKIT_API_URL=https://${DOMAIN}
ENVEOF
  echo "✅ Variables LiveKit ajoutées au .env API"
else
  echo "ℹ️  Variables LiveKit déjà présentes dans le .env"
fi
ENDSSH

# ── 10. Redémarrer l'API pour charger les nouvelles vars ───────────────────
echo ""
echo "🔄 Redémarrage de l'API..."
$SSH_CMD bash <<ENDSSH
set -euo pipefail
cd /opt/psyscale-api
docker compose restart api
echo "⏳ Attente redémarrage API (15s)..."
sleep 15
if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
  echo "✅ API redémarrée avec succès"
else
  echo "⚠️  API pas encore up — vérifie: docker compose logs api"
fi
ENDSSH

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ LiveKit déployé et opérationnel !"
echo ""
echo "📌 Prochaines étapes :"
echo ""
echo "1. Tester la connexion WebSocket :"
echo "   curl -I https://$DOMAIN"
echo ""
echo "2. Ajouter les variables Vercel (pour le frontend Next.js) :"
echo "   NEXT_PUBLIC_LIVEKIT_WS_URL = wss://$DOMAIN"
echo ""
echo "3. Vérifier le TURN server :"
echo "   Le TURN est sur le port 7882/tcp (video.psylib.eu)"
echo ""
echo "4. Variables API ajoutées au .env :"
echo "   LIVEKIT_API_KEY     = $LK_API_KEY"
echo "   LIVEKIT_API_SECRET  = $LK_API_SECRET"
echo "   LIVEKIT_WS_URL      = wss://$DOMAIN"
echo "   LIVEKIT_API_URL     = https://$DOMAIN"
echo "════════════════════════════════════════════════════════"
