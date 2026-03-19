# PsyScale — Avancement du projet

**Dernière mise à jour :** 2026-03-13 (Phase 4 — COMPLÈTE ✅)

---

## État global

| Phase | Statut |
|---|---|
| Phase 1 — Fondations | ✅ Terminée |
| Phase 2 — MVP Core | ✅ Terminée |
| Phase 3 — Monétisation | ✅ Terminée |
| Phase 4 — Croissance | ✅ Terminée |

---

## apps/api (NestJS 10)

### Modules implémentés ✅
- **Auth** : KeycloakGuard, RolesGuard, CurrentUser decorator, AuditInterceptor
- **Common** : EncryptionService (AES-256-GCM), AuditService, PrismaService
- **Health** : GET /health → `{ status, db, redis }`
- **Patients** : CRUD + soft delete + purge RGPD + SubscriptionGuard sur POST
- **Sessions** : CRUD + autosave (PATCH /:id/autosave) + stats mensuelles + SubscriptionGuard sur POST
- **AI** : streamSessionSummary (SSE), generateExercise, generateContent, **streamContent (SSE)**, content-library CRUD
- **Billing** : StripeService, SubscriptionService, BillingController, WebhookController, BullMQ queue, SubscriptionGuard, RequireFeature decorator
- **PatientPortal** : auth JWT patient (bcryptjs), mood tracking, exercices, journal, invitations
- **Notifications** : EmailService Resend (invitation, mood, exercice complété, invitation acceptée)
- **Messaging** : WebSocket gateway /messaging + REST conversations/messages, chiffrement AES-256-GCM
- **Analytics** : overview, revenue/month, patients/month, mood-trends
- **Invoices** : CRUD + PDF pdfkit (numéro PSY-YYYY-NNN, template professionnel, TVA Art. 261-4-1°)
- **Courses** : CRUD courses/modules + enrollment + progress, SubscriptionGuard PRO requis
- **Prisma** : schema complet + MarketingContent + User.passwordHash, migrations

### Fichiers clés
```
apps/api/src/
├── main.ts                          ← rawBody: true (Stripe)
├── app.module.ts                    ← tous les modules + BullMQ
├── auth/                            ← Keycloak JWT strategy
├── patients/patients.controller.ts
├── sessions/sessions.controller.ts
├── ai/ai.controller.ts              ← SSE streaming + content-library
├── ai/ai.service.ts                 ← Anthropic + OpenAI + marketing content
├── billing/                         ← Stripe complet
├── patient-portal/                  ← auth JWT patient + portal
├── notifications/email.service.ts   ← Resend
├── messaging/                       ← Socket.io + chiffrement
├── analytics/                       ← 4 endpoints stats
├── invoices/                        ← PDF pdfkit
├── courses/                         ← formations + enrollment
└── common/encryption.service.ts    ← AES-256-GCM HDS
```

---

## apps/web (Next.js 14)

### Pages implémentées ✅
- `/login` — Keycloak OIDC via next-auth v5
- `/onboarding/[step]` — Wizard 5 étapes
- `/dashboard` — KPIs, actions rapides, plan info
- `/dashboard/patients` — Liste paginée
- `/dashboard/patients/[id]` — Fiche patient + section portail patient
- `/dashboard/patients/new` — Création patient
- `/dashboard/sessions` — Liste avec filtres
- `/dashboard/sessions/[id]` — Détail + éditeur de notes
- `/dashboard/sessions/new` — Nouvelle séance
- `/dashboard/ai-assistant` — Exercices + contenu marketing IA (streaming + sélecteur ton + bibliothèque)
- `/dashboard/calendar` — Calendrier mensuel + RDV
- `/dashboard/settings/billing` — Plans, invoices, portail Stripe
- `/dashboard/settings/profile` — Profil psychologue (nom, bio, ADELI, téléphone, adresse)
- `/dashboard/messages` — Chat Socket.io 2 colonnes
- `/dashboard/analytics` — KPIs + charts SVG (revenus + patients)
- `/dashboard/courses` — Liste + création + détail + modules
- `/patient/login` — Auth patient (JWT séparé)
- `/patient/accept-invitation` — Accepter invitation portail
- `/patient-portal/` — Dashboard patient
- `/patient-portal/mood` — Mood tracking
- `/patient-portal/exercises` — Exercices assignés
- `/patient-portal/journal` — Journal chiffré

### Composants clés
```
apps/web/src/
├── components/sessions/session-note-editor.tsx   ← autosave + streaming IA
├── components/ai/ai-assistant-content.tsx        ← 3 onglets (exercice + contenu + bibliothèque)
├── components/calendar/calendar-content.tsx      ← grille mensuelle
├── components/billing/                           ← billing complet
├── components/patients/patient-portal-section.tsx
├── components/layouts/sidebar.tsx
├── components/layouts/mobile-nav.tsx             ← bottom bar + FAB
├── lib/api/ai.ts                                 ← client SSE streaming
├── lib/api/patient-portal.ts                     ← portail patient (/api/v1)
├── hooks/use-messaging.ts                        ← Socket.io
└── middleware.ts                                 ← auth guard
```

### Fixes TS importants
- `tsconfig.json` : `"declaration": false, "declarationMap": false` → fix TS2742 next-auth v5
- `next.config.ts` : `output: 'standalone'` → requis pour Docker

---

## apps/mobile (Expo SDK 51 + React Native)

### Implémenté ✅
- Auth : Keycloak OIDC via `expo-auth-session` + `expo-secure-store`
- 4 onglets : Dashboard, Patients, Séances, Calendrier
- NoteEditor : autosave 30s, MoodSelector 5 niveaux, bannière IA opt-in
- Design tokens identiques au web (`#3D52A0`, `#0D9488`, etc.)
- Accessibilité complète (accessibilityLabel + accessibilityRole partout)

---

## packages/shared-types

- Enums : UserRole, SubscriptionPlan, SessionType, PatientStatus…
- Interfaces : User, Psychologist, Patient, Session, Appointment…
- Types API : PaginatedResponse\<T\>, ApiError, contrats requêtes/réponses
- PLAN_LIMITS : FREE(5/10/0), STARTER(20/40/10), PRO(∞/∞/100), CLINIC(∞/∞/∞)

---

## Infrastructure

### Développement
- **docker-compose.yml** : postgres:16, redis:7, keycloak:24, mailhog
- **docker/keycloak/psyscale-realm.json** : realm + clients + rôles + MFA TOTP

### Production (créé ✅)
- **infrastructure/terraform/** : VPC, RDS PostgreSQL 16 (Multi-AZ, KMS), ElastiCache Redis, ECS Fargate (auto-scaling), ALB (TLS 1.3), S3 (patients KMS + cours), ECR, IAM
- **apps/api/Dockerfile** : multi-stage NestJS (non-root)
- **apps/web/Dockerfile** : multi-stage Next.js standalone (non-root)
- **docker/keycloak-prod/** : Keycloak 24 prod + nginx TLS 1.3 (OVH HDS)
- **.github/workflows/ci.yml** : typecheck + lint sur PR
- **.github/workflows/deploy.yml** : build → ECR → migrate → ECS + Vercel
- **scripts/deploy-api.sh** : déploiement manuel
- **scripts/setup-aws-params.sh** : injection secrets SSM
- **.env.production.example** : template complet des variables

---

## Phase 4 — Complète ✅

- [x] Invitations patients → espace patient (portal)
- [x] Espace patient : mood tracking, exercices, journal
- [x] Notifications emails (Resend) — invitation, mood, exercice complété
- [x] Settings : profil psychologue (nom, bio, spécialisation, ADELI, téléphone, adresse)
- [x] Messagerie temps réel (Socket.io — WebSocket gateway + REST + chat UI)
- [x] Analytics dashboard (MRR, rétention, charts SVG)
- [x] Facturation PDF (pdfkit — template professionnel)
- [x] Plateforme formations (CRUD courses + modules + enrollments + progress)
- [x] Marketing IA (LinkedIn, newsletter, blog — streaming SSE + ton + bibliothèque)
- [x] Deploy production (Terraform AWS ECS + OVH HDS + GitHub Actions CI/CD)

---

## Commandes

```bash
# ─── Développement ──────────────────────────────────────────────
docker compose up -d                                    # Services dev
cd apps/api && pnpm prisma migrate dev --name init      # Première migration
pnpm dev                                                # web :3000 + api :4000
cd apps/mobile && pnpm start                            # Expo mobile

# ─── Migration Marketing IA (à faire une fois) ──────────────────
cd apps/api && pnpm prisma migrate dev --name add_marketing_contents

# ─── Production (première fois) ─────────────────────────────────
cd infrastructure/terraform && terraform init && terraform apply
source .env.production && ./scripts/setup-aws-params.sh
./scripts/deploy-api.sh
npx vercel --prod

# ─── Déploiement continu ─────────────────────────────────────────
git push origin main    # → GitHub Actions déclenche automatiquement
```

---

## Secrets GitHub Actions requis

| Secret | Description |
|---|---|
| `AWS_ACCOUNT_ID` | ID de compte AWS (12 chiffres) |
| `AWS_ACCESS_KEY_ID` | Clé IAM ECS + ECR |
| `AWS_SECRET_ACCESS_KEY` | Secret IAM |
| `ECS_SUBNET_ID` | Subnet pour migrations |
| `ECS_SECURITY_GROUP_ID` | Security group ECS |
| `DATABASE_URL` | URL RDS prod |
| `VERCEL_TOKEN` | Token API Vercel |
| `VERCEL_ORG_ID` | ID organisation Vercel |
| `VERCEL_PROJECT_ID` | ID projet Vercel |
