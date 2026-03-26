# PsyScale — Avancement du projet

**Dernière mise à jour :** 2026-03-26

---

## État global

| Phase | Statut |
|---|---|
| Phase 1 — Fondations | ✅ Terminée |
| Phase 2 — MVP Core | ✅ Terminée |
| Phase 3 — Monétisation | ✅ Terminée |
| Phase 4 — Croissance | ✅ Terminée |
| Audit & Hardening | ✅ 2026-03-26 |

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

## Audit & Hardening — 2026-03-26 ✅

### Audit complet (4 agents spécialisés)
- Audit codebase : 100+ pages web, 25+ modules backend, app mobile Android
- Audit sécurité & conformité HDS
- Audit UX/UI design & accessibilité WCAG
- Audit marketing & stratégie de conversion

### Corrections sécurité (`395e684`)
- [x] **MFA TOTP obligatoire** — `defaultAction: true` dans les realm JSON Keycloak (dev + prod)
- [x] **Mots de passe Keycloak prod** — régénérés (fichier `.env` gitignored)
- [x] **JWT patient** — réduit de 7j à 1h + refresh token 7j + endpoint `POST /patient-portal/auth/refresh`
- [x] **Consentement IA** — `checkAiConsent()` vérifie `gdpr_consents.ai_processing` avant envoi au LLM
- [x] **Consentements RGPD complets** — 3 consentements créés à l'inscription patient (`portal_access`, `data_processing`, `ai_processing`)
- [x] **Bandeau cookies CNIL** — `cookie-consent.tsx`, PostHog ne s'initialise qu'après acceptation explicite

### Corrections conversion (`fcf7b38`)
- [x] **CTAs `/login` → `/register`** — 10 boutons d'acquisition corrigés (hero, nav, pricing, sticky, tarifs, fonctionnalités, FAQ, contact)
- [x] **JSON-LD prix** — `lowPrice: 43`, `highPrice: 119` (home + fonctionnalités)
- [x] **WCAG contraste** — `text-charcoal-300→400` sur 10 composants landing (ratio 2.8:1 → 5.9:1)

### Corrections infra (`3d89733`)
- [x] Login page redesign split-screen
- [x] Dashboard alertes cliniques (score en baisse, inactivité, exercice en retard)
- [x] Pagination patients/sessions dans la card blanche
- [x] CI : retiré `|| true` du lint, ajouté job test avec Prisma generate
- [x] Keycloak : redirectUri psylib.eu + SMTP Resend en prod
- [x] Docker/Terraform : domaines psyscale.fr → psylib.eu
- [x] Scripts backup PostgreSQL + Keycloak DB
- [x] Secrets retirés de `set-vercel-env.sh`
- [x] API cold-email + page unsubscribe

### Actions manuelles restantes (VPS prod)
- [ ] Mettre à jour mots de passe Keycloak en prod
- [ ] Réimporter realm JSON avec MFA TOTP obligatoire
- [ ] Configurer SMTP Resend dans Keycloak admin
- [ ] Installer crons backup PostgreSQL + Keycloak
- [ ] Vérifier/changer client secret Keycloak

### Corrections polish (2026-03-26, session 2)
- [x] **Notifications settings** — GET/PUT `/notifications/preferences` + JSON field User + page frontend branchée
- [x] **Sessions page retry** — bouton "Réessayer" sur erreur de chargement (comme patients-page)
- [x] **CSV injection protection** — `sanitize()` sur exports patients/sessions (=, +, -, @, tab, CR)
- [x] **Gitignore .aab/.apk** — ajouté dans `apps/mobile/.gitignore`
- [x] **Cleanup formatters** — `formatDateShort`, `formatDateUnix` centralisés dans `lib/utils.ts`, 5 fichiers refactorisés
- [x] **Cleanup EmptyState** — `courses-content.tsx` utilise maintenant le composant shared
- [x] **Séquence emails post-trial** — 5 emails (J-7, J-5, J-3, J-1, J0) + cron `@Cron('30 9 * * *')` + dedup audit_logs

### Corrections pricing (2026-03-26, session 3)
- [x] **Starter 43€/mois** — prix arrondi (était 29,99€), 40 patients (était 20), Stripe Price ID mis à jour
- [x] **Pro 69€/mois** — prix arrondi (était 69,99€), Stripe Price ID mis à jour
- [x] **Scale 119€/mois** — prix arrondi (était 119,99€), Stripe Price ID mis à jour
- [x] **Stripe** — 3 nouveaux Price IDs créés, anciens désactivés, VPS `.env` mis à jour, API redémarrée
- [x] **14 fichiers** mis à jour : landing, tarifs, FAQ, CGV, blog, comparaison, fonctionnalités, OG images, JSON-LD, llms.txt, emails post-trial, billing components, shared-types
- [x] **Vercel** — déployé en production sur psylib.eu
- [x] **Fix lead magnet** — URL corrigée `/api/lead-magnets/download` → `/api/lead-magnets`

### Keycloak admin (2026-03-26, session 3)
- [x] **Post logout redirect URIs** — ajouté `psylib.eu/*` et `www.psylib.eu/*`
- [x] **Client secret vérifié** — WPYygR1A5zMm1LsQn8PbP0KUCFuQkDZP
- [x] **MFA TOTP obligatoire** — Configure OTP activé comme default action, browser flow vérifié
- [x] **SMTP Resend configuré** — smtp.resend.com dans Keycloak prod realm
- [x] **Crons backup installés** — PostgreSQL (2h) + Keycloak DB (3h) quotidiens

### Reste à faire
- [ ] Migration Prisma `notification_preferences` (champ JSON sur users)
- [ ] Recruter 3-5 beta-testeurs psys pour témoignages réels
- [ ] Débloquer port SMTP OVH (contacter support)

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
