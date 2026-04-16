#!/bin/bash
# ============================================================
# PsyScale — Créer un compte fondateur (Clinic gratuit)
#
# Usage :
#   bash scripts/create-founder-account.sh \
#     --name "Pauline Fournier" \
#     --email "paulinefournier.neuropsy@gmail.com" \
#     --adeli "149300121"
#
# Ce que fait le script :
#   1. Crée le user dans Keycloak (avec UPDATE_PASSWORD obligatoire)
#   2. Assigne le rôle "psychologist" dans Keycloak
#   3. Crée le user + psychologist + subscription (plan clinic, gratuit) en DB
#   4. Synchronise le DB user ID avec le Keycloak ID
#
# Pré-requis :
#   - Accès SSH au VPS (clé ~/.ssh/psyscale_ovh)
#   - Keycloak et PostgreSQL en cours d'exécution sur le VPS
# ============================================================
set -euo pipefail

# ─── Configuration ──────────────────────────────────────────
VPS_HOST="51.178.31.68"
VPS_USER="ubuntu"
SSH_KEY="$HOME/.ssh/psyscale_ovh"
DB_CONTAINER="psyscale-api-postgres-1"
KC_CONTAINER="psyscale-keycloak"
KC_REALM="psyscale"
DB_USER="psyscale"
DB_NAME="psyscale"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}══${NC} $1"; }

# ─── Parse des arguments ────────────────────────────────────
NAME=""
EMAIL=""
ADELI=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --name)  NAME="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --adeli) ADELI="$2"; shift 2 ;;
    *) fail "Argument inconnu: $1. Usage: --name \"...\" --email \"...\" --adeli \"...\"" ;;
  esac
done

[[ -n "$NAME" ]]  || fail "Argument --name requis"
[[ -n "$EMAIL" ]] || fail "Argument --email requis"
[[ -n "$ADELI" ]] || fail "Argument --adeli requis"

# Extraire prénom/nom pour Keycloak
FIRST_NAME="${NAME%% *}"
LAST_NAME="${NAME#* }"

# Générer un slug à partir du nom
SLUG=$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')

echo ""
echo -e "  Nom     : ${CYAN}${NAME}${NC}"
echo -e "  Email   : ${CYAN}${EMAIL}${NC}"
echo -e "  ADELI   : ${CYAN}${ADELI}${NC}"
echo -e "  Slug    : ${CYAN}${SLUG}${NC}"
echo ""

SSH_CMD="ssh -i $SSH_KEY ${VPS_USER}@${VPS_HOST}"

# ─── Vérifications ──────────────────────────────────────────
step "Vérifications"

# Vérifier SSH
$SSH_CMD "echo ok" > /dev/null 2>&1 || fail "Impossible de se connecter au VPS via SSH"
ok "Connexion SSH"

# Vérifier que le compte n'existe pas déjà en DB
EXISTING=$($SSH_CMD "sudo docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc \"SELECT count(*) FROM users WHERE email = '$EMAIL';\"")
if [[ "$EXISTING" -gt 0 ]]; then
  fail "Un compte avec l'email $EMAIL existe déjà en DB"
fi
ok "Email non utilisé en DB"

# Vérifier que le compte n'existe pas dans Keycloak
KC_ADMIN_PASS=$($SSH_CMD "sudo docker exec $KC_CONTAINER env" | grep KEYCLOAK_ADMIN_PASSWORD | cut -d= -f2 | tr -d '\r')
KC_CHECK=$($SSH_CMD "
  TOKEN=\$(curl -s -X POST 'http://localhost:8080/realms/master/protocol/openid-connect/token' \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d 'username=admin&password=${KC_ADMIN_PASS}&grant_type=password&client_id=admin-cli' | jq -r .access_token)
  curl -s 'http://localhost:8080/admin/realms/${KC_REALM}/users?email=${EMAIL}' \
    -H \"Authorization: Bearer \$TOKEN\" | jq length
")
if [[ "$KC_CHECK" -gt 0 ]]; then
  fail "Un compte avec l'email $EMAIL existe déjà dans Keycloak"
fi
ok "Email non utilisé dans Keycloak"

# ─── Étape 1 : Créer le user dans Keycloak ─────────────────
step "Création du user Keycloak"

KC_RESULT=$($SSH_CMD "
  TOKEN=\$(curl -s -X POST 'http://localhost:8080/realms/master/protocol/openid-connect/token' \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d 'username=admin&password=${KC_ADMIN_PASS}&grant_type=password&client_id=admin-cli' | jq -r .access_token)

  HTTP_CODE=\$(curl -s -o /dev/null -w '%{http_code}' -X POST 'http://localhost:8080/admin/realms/${KC_REALM}/users' \
    -H \"Authorization: Bearer \$TOKEN\" \
    -H 'Content-Type: application/json' \
    -d '{
      \"username\": \"${EMAIL}\",
      \"email\": \"${EMAIL}\",
      \"emailVerified\": true,
      \"enabled\": true,
      \"firstName\": \"${FIRST_NAME}\",
      \"lastName\": \"${LAST_NAME}\",
      \"requiredActions\": [\"UPDATE_PASSWORD\"]
    }')

  echo \$HTTP_CODE
")

if [[ "$KC_RESULT" != "201" ]]; then
  fail "Erreur Keycloak lors de la création du user (HTTP $KC_RESULT)"
fi
ok "User Keycloak créé (UPDATE_PASSWORD requis à la première connexion)"

# ─── Étape 2 : Récupérer le Keycloak ID et assigner le rôle ─
step "Attribution du rôle psychologist"

KC_ID=$($SSH_CMD "
  TOKEN=\$(curl -s -X POST 'http://localhost:8080/realms/master/protocol/openid-connect/token' \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d 'username=admin&password=${KC_ADMIN_PASS}&grant_type=password&client_id=admin-cli' | jq -r .access_token)

  curl -s 'http://localhost:8080/admin/realms/${KC_REALM}/users?email=${EMAIL}' \
    -H \"Authorization: Bearer \$TOKEN\" | jq -r '.[0].id'
")

if [[ -z "$KC_ID" || "$KC_ID" == "null" ]]; then
  fail "Impossible de récupérer le Keycloak ID"
fi
ok "Keycloak ID : $KC_ID"

ROLE_RESULT=$($SSH_CMD "
  TOKEN=\$(curl -s -X POST 'http://localhost:8080/realms/master/protocol/openid-connect/token' \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d 'username=admin&password=${KC_ADMIN_PASS}&grant_type=password&client_id=admin-cli' | jq -r .access_token)

  ROLES=\$(curl -s 'http://localhost:8080/admin/realms/${KC_REALM}/roles' -H \"Authorization: Bearer \$TOKEN\")
  PSY_ROLE=\$(echo \$ROLES | jq '[.[] | select(.name==\"psychologist\")]')

  curl -s -o /dev/null -w '%{http_code}' -X POST \
    'http://localhost:8080/admin/realms/${KC_REALM}/users/${KC_ID}/role-mappings/realm' \
    -H \"Authorization: Bearer \$TOKEN\" \
    -H 'Content-Type: application/json' \
    -d \"\$PSY_ROLE\"
")

if [[ "$ROLE_RESULT" != "204" ]]; then
  fail "Erreur lors de l'attribution du rôle (HTTP $ROLE_RESULT)"
fi
ok "Rôle psychologist attribué"

# ─── Étape 3 : Créer le compte en DB (user + psychologist + subscription) ─
step "Création en base de données"

DB_RESULT=$($SSH_CMD "sudo docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc \"
DO \\\$\\\$
DECLARE
  v_psy_id uuid := gen_random_uuid();
BEGIN
  -- User (ID = Keycloak ID)
  INSERT INTO users (id, email, role, locale, timezone, created_at)
  VALUES ('${KC_ID}', '${EMAIL}', 'psychologist', 'fr', 'Europe/Paris', NOW());

  -- Psychologist
  INSERT INTO psychologists (id, user_id, name, slug, adeli_number, is_onboarded, created_at)
  VALUES (v_psy_id, '${KC_ID}', '${NAME}', '${SLUG}', '${ADELI}', false, NOW());

  -- Subscription Clinic gratuite (pas de Stripe = protégé des webhooks)
  INSERT INTO subscriptions (id, psychologist_id, plan, status)
  VALUES (gen_random_uuid(), v_psy_id, 'clinic', 'active');

  RAISE NOTICE 'OK psy_id=%', v_psy_id;
END
\\\$\\\$;
\"")

ok "User + Psychologist + Subscription créés en DB"

# ─── Étape 4 : Vérification finale ─────────────────────────
step "Vérification finale"

VERIFY=$($SSH_CMD "sudo docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc \"
SELECT u.id || '|' || p.name || '|' || s.plan || '|' || s.status
FROM users u
JOIN psychologists p ON p.user_id = u.id
JOIN subscriptions s ON s.psychologist_id = p.id
WHERE u.email = '${EMAIL}';
\"")

if [[ -z "$VERIFY" ]]; then
  fail "Vérification échouée — le compte n'a pas été trouvé en DB"
fi

IFS='|' read -r V_ID V_NAME V_PLAN V_STATUS <<< "$VERIFY"
ok "Compte vérifié :"
echo -e "  User ID : ${CYAN}${V_ID}${NC}"
echo -e "  Nom     : ${CYAN}${V_NAME}${NC}"
echo -e "  Plan    : ${CYAN}${V_PLAN}${NC}"
echo -e "  Status  : ${CYAN}${V_STATUS}${NC}"

echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Compte fondateur créé avec succès !${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}${NAME}${NC} peut maintenant :"
echo -e "  1. Se connecter sur ${CYAN}psylib.eu${NC}"
echo -e "  2. Créer son mot de passe"
echo -e "  3. Configurer le MFA (Google Authenticator)"
echo -e "  4. Compléter l'onboarding"
echo -e ""
echo -e "  Plan ${CYAN}Clinic${NC} actif — toutes fonctionnalités — gratuit"
echo ""
