#!/bin/bash
set -euo pipefail

# Injecte toutes les secrets dans AWS SSM Parameter Store
# Usage: source .env.production && ./scripts/setup-aws-params.sh

AWS_REGION="eu-west-3"
PREFIX="/psyscale"

echo "🔐 Setting up AWS SSM parameters..."

put_param() {
  local name="$1"
  local value="$2"
  local type="${3:-SecureString}"

  aws ssm put-parameter \
    --name "${PREFIX}/${name}" \
    --value "${value}" \
    --type "${type}" \
    --overwrite \
    --region "${AWS_REGION}"
  echo "  ✓ ${name}"
}

put_param "DATABASE_URL"           "${DATABASE_URL}"
put_param "REDIS_URL"              "${REDIS_URL}"
put_param "ENCRYPTION_KEY"         "${ENCRYPTION_KEY}"
put_param "JWT_SECRET"             "${JWT_SECRET}"
put_param "PATIENT_JWT_SECRET"     "${PATIENT_JWT_SECRET}"
put_param "STRIPE_SECRET_KEY"      "${STRIPE_SECRET_KEY}"
put_param "STRIPE_WEBHOOK_SECRET"  "${STRIPE_WEBHOOK_SECRET}"
put_param "ANTHROPIC_API_KEY"      "${ANTHROPIC_API_KEY}"
put_param "RESEND_API_KEY"         "${RESEND_API_KEY}"
put_param "KEYCLOAK_URL"           "${KEYCLOAK_URL}" "String"
put_param "KEYCLOAK_REALM"         "${KEYCLOAK_REALM}" "String"
put_param "KEYCLOAK_CLIENT_ID"     "${KEYCLOAK_CLIENT_ID}" "String"
put_param "KEYCLOAK_CLIENT_SECRET" "${KEYCLOAK_CLIENT_SECRET}"

echo ""
echo "✅ All parameters set in SSM (${AWS_REGION})"
echo "   Prefix: ${PREFIX}"
