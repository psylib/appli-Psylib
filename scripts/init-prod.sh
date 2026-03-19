#!/bin/bash
set -euo pipefail

# PsyScale — Production first-time setup
# Pré-requis : AWS CLI configuré, Terraform installé, accès OVH

echo "════════════════════════════════════════════════════════"
echo " PsyScale — Production Setup"
echo "════════════════════════════════════════════════════════"

check_tool() {
  if ! command -v "$1" &>/dev/null; then
    echo "❌ $1 is not installed. Please install it first."
    exit 1
  fi
  echo "  ✓ $1"
}

echo ""
echo "🔍 Checking required tools..."
check_tool aws
check_tool terraform
check_tool docker
check_tool pnpm

echo ""
echo "📋 Steps to deploy PsyScale to production:"
echo ""
echo "1. AWS Infrastructure (Terraform):"
echo "   cd infrastructure/terraform"
echo "   cp terraform.tfvars.example terraform.tfvars"
echo "   # Edit terraform.tfvars with your values"
echo "   terraform init"
echo "   terraform plan"
echo "   terraform apply"
echo ""
echo "2. Set AWS SSM parameters:"
echo "   cp .env.production.example .env.production"
echo "   # Edit .env.production with your values"
echo "   source .env.production && ./scripts/setup-aws-params.sh"
echo ""
echo "3. Deploy Keycloak (OVH):"
echo "   # SSH into OVH server"
echo "   # scp docker/keycloak-prod/ user@ovh-server:/opt/keycloak/"
echo "   # sudo docker compose -f /opt/keycloak/docker-compose.yml up -d"
echo ""
echo "4. Request ACM Certificate:"
echo "   aws acm request-certificate \\"
echo "     --domain-name api.psylib.eu \\"
echo "     --validation-method DNS \\"
echo "     --region eu-west-3"
echo ""
echo "5. Deploy API:"
echo "   ./scripts/deploy-api.sh"
echo ""
echo "6. Deploy Web (Vercel):"
echo "   npx vercel --prod"
echo ""
echo "7. Configure DNS:"
echo "   api.psylib.eu   -> ALB DNS (from terraform output alb_dns_name)"
echo "   app.psylib.eu   -> Vercel deployment URL"
echo "   auth.psylib.eu  -> OVH server IP"
echo ""
echo "════════════════════════════════════════════════════════"
