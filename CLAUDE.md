# PROJECT: PsyScale

Plateforme SaaS tout-en-un pour psychologues libéraux — gestion de cabinet, suivi patient, formations, assistant IA.

**Role:** Senior software architect, product designer et SaaS builder.
**Mission:** SaaS production-ready, scalable, sécurisé, conforme HDS France.

---

# VISION PRODUIT

PsyScale = "Doctolib + Kajabi + Notion + ChatGPT" pour psychologues libéraux.

**Marché :** ≈ 30 000 psychologues libéraux en France
**Objectif :** 1 000 clients payants × 97€/mois = ~97 000€ MRR

---

# STACK TECHNIQUE (DÉFINITIVE)

## Frontend
- **Next.js** (App Router) + TypeScript strict
- **TailwindCSS** + shadcn/ui
- **React Query** (server state) + **Zustand** (UI state)
- **React Hook Form** + **Zod** (validation formulaires)
- **Vercel AI SDK** (streaming IA)

## Backend
- **NestJS** (Node.js, TypeScript strict)
- **Prisma ORM** + **PostgreSQL**
- **Keycloak** (auth — self-hosted OVH HDS)
- **Socket.io** (realtime messagerie)
- **Bull/BullMQ** (queues : emails, IA, webhooks)

## Infrastructure (double cloud HDS)

| Rôle | Provider | Service | HDS |
|---|---|---|---|
| Compute API | **AWS eu-west-3** (Paris) | ECS / EC2 Docker | ✅ |
| Load Balancer | **AWS eu-west-3** | ALB (Application Load Balancer) | ✅ |
| Base de données | **AWS eu-west-3** | RDS PostgreSQL (chiffrement at-rest) | ✅ |
| Stockage fichiers patients | **AWS eu-west-3** | S3 (bucket privé chiffré SSE-KMS) | ✅ |
| Stockage vidéos cours | **AWS eu-west-3** | S3 + CloudFront | ✅ |
| Auth (Keycloak) | **OVH HDS** | Instance dédiée Docker | ✅ |
| Backup DB | **OVH HDS** | Object Storage | ✅ |

> AWS eu-west-3 (Paris) est **certifié HDS** depuis 2022 pour EC2, RDS, S3, ECS, EKS.
> Les deux providers sont conformes — AWS pour le compute/data, OVH pour Keycloak et les backups.

## Services tiers
- **Stripe** (paiements + subscriptions)
- **Resend** + **React Email** (emails transactionnels)
- **OpenAI API** ou **Claude API** (IA)
- **Sentry** (monitoring erreurs — sans données patients)
- **PostHog** (analytics produit — psy uniquement, jamais patients)

## Testing
- **Vitest** (unit + integration)
- **Playwright** (E2E)
- **Supertest** (API NestJS)

## Mobile (Phase 4)
- **React Native** (Expo)

---

# AUTHENTIFICATION (KEYCLOAK)

## Pourquoi Keycloak et pas Auth0

| Critère | Keycloak (self-hosted OVH) | Auth0 (SaaS) |
|---|---|---|
| Certification HDS | ✅ (hébergé sur OVH HDS) | ❌ (serveurs US) |
| MFA natif | ✅ | ✅ |
| RBAC avancé | ✅ | ✅ (payant) |
| Audit logs complets | ✅ | ✅ (payant) |
| Coût | Gratuit (infra OVH) | 240€+/mois à l'échelle |
| Contrôle total données auth | ✅ | ❌ |

> Auth0 stocke les identités sur ses serveurs (USA) → incompatible HDS pour données de santé.
> **Keycloak déployé sur OVH HDS = seul choix légalement conforme.**

## Fonctionnalités Keycloak activées

### MFA (Multi-Factor Authentication)
- TOTP (Google Authenticator, Authy) — obligatoire pour le rôle `psychologist`
- SMS OTP — optionnel
- WebAuthn (clé physique FIDO2) — optionnel premium
- MFA non obligatoire pour patients (UX patient plus simple)

### Gestion des rôles (RBAC)
```
Realm : psyscale

Rôles :
├── psychologist       ← Accès dashboard complet
│   ├── read:patients
│   ├── write:patients
│   ├── read:sessions
│   ├── write:sessions
│   ├── read:ai
│   ├── write:ai
│   └── manage:billing
├── patient            ← Accès espace patient uniquement
│   ├── read:own-mood
│   ├── write:own-mood
│   ├── read:own-exercises
│   └── read:own-journal
└── admin              ← Accès backoffice PsyScale
    └── manage:all
```

### Audit des accès (Keycloak Events)
Keycloak génère des événements natifs loggés et persistés :
- `LOGIN` / `LOGOUT` / `LOGIN_ERROR`
- `TOKEN_REFRESH`
- `UPDATE_PASSWORD`
- `MFA_CHALLENGE` / `MFA_FAILURE`
- `CLIENT_ACCESS`

Ces événements sont exportés vers la table `audit_logs` PostgreSQL via un event listener NestJS.

## Intégration NestJS + Keycloak

```
Keycloak (OVH HDS)
      │  JWT / OIDC
      ▼
NestJS API
  └─ KeycloakGuard (valide le JWT à chaque requête)
  └─ RolesGuard (vérifie les rôles du token)
  └─ AuditInterceptor (log chaque accès données sensibles)

Next.js Frontend
  └─ next-auth avec provider Keycloak OIDC
  └─ Session côté serveur (SSR App Router)
```

## Flow authentification

```
1. Psy arrive sur /login
2. Redirect vers Keycloak (OIDC Authorization Code Flow)
3. Keycloak : email + password
4. MFA challenge (TOTP obligatoire pour psys)
5. Keycloak émet : Access Token (15min) + Refresh Token (8h)
6. Next.js reçoit les tokens via callback OIDC
7. NestJS valide chaque requête : KeycloakGuard vérifie signature JWT
8. À chaque accès données patients : AuditInterceptor log dans audit_logs
```

## Variables d'environnement requises
```env
KEYCLOAK_URL=https://auth.psyscale.fr        # OVH HDS
KEYCLOAK_REALM=psyscale
KEYCLOAK_CLIENT_ID=psyscale-app
KEYCLOAK_CLIENT_SECRET=***
KEYCLOAK_ADMIN_CLIENT_ID=psyscale-admin
KEYCLOAK_ADMIN_SECRET=***
```

---

# CONFORMITÉ HDS (CRITIQUE)

> Les données de patients en psychologie sont des **données de santé** au sens de l'article L.1111-8 du Code de la santé publique. L'hébergement sur infrastructure non-certifiée HDS est illégal. Amende CNIL : jusqu'à 20M€ ou 4% du CA.

## Statut de conformité

| Exigence | Solution | Statut |
|---|---|---|
| Hébergement HDS | AWS eu-west-3 Paris + OVH HDS | ✅ |
| Chiffrement at-rest | AWS RDS AES-256 + S3 SSE-KMS | ✅ |
| Chiffrement applicatif | AES-256-GCM (NestJS) sur champs sensibles | ✅ |
| Chiffrement transit | TLS 1.3 partout | ✅ |
| Authentification forte | Keycloak + MFA TOTP obligatoire (psys) | ✅ |
| Contrôle d'accès RBAC | Keycloak Roles + NestJS Guards | ✅ |
| Audit des accès | Keycloak Events + table `audit_logs` | ✅ |
| Consentements RGPD | Table `gdpr_consents` versionnée | ✅ |
| Droit à l'effacement | Endpoint `/patients/:id/purge` | ✅ |
| Isolation multi-tenant | `psychologist_id` filtre applicatif + DB | ✅ |
| Pas de données patients hors HDS | IA : données anonymisées seulement | ✅ |
| Backup cross-cloud | RDS → OVH HDS Object Storage | ✅ |

**Obligations implémentées :**
- Chiffrement AES-256-GCM des champs sensibles (`notes`, `summary_ai`, `journal content`, `messages`)
- Audit logs sur toutes les opérations sur données patients
- Consentements RGPD enregistrés avec version et date
- Droit à l'effacement (soft delete + purge sur demande)
- Pas d'envoi de données patients à des LLM tiers sans consentement explicite
- NestJS backend sur Docker OVH — jamais Supabase Cloud (non HDS)

---

# ARCHITECTURE SYSTÈME

```
Client (Next.js — Vercel ou AWS CloudFront)
      │  HTTPS / TLS 1.3
      ▼
AWS ALB — Load Balancer (eu-west-3 Paris HDS)
      │
      ▼
AWS ECS — NestJS API (Docker)   ←→   Bull Queue (jobs async)
      │                                     │
      ├─ Prisma ORM                         ├─ Email worker (Resend)
      │                                     ├─ AI worker (OpenAI/Claude)
      ▼                                     └─ Stripe webhook worker
AWS RDS PostgreSQL (eu-west-3 HDS)
      │  Chiffrement at-rest (AES-256)
      ├─ Champs sensibles chiffrés AES-256-GCM (applicatif)
      └─ Audit logs

AWS S3 (eu-west-3 HDS — SSE-KMS)
      ├─ Documents patients (bucket privé, accès signé)
      └─ Vidéos cours (bucket + CloudFront CDN)

OVH HDS
      ├─ Keycloak (instance Docker dédiée)
      └─ Backup RDS (snapshots cross-cloud)

Socket.io Gateway (NestJS ECS)
      └─ Messagerie temps réel psy ↔ patient
```

**Multi-tenant :** chaque psychologue est un tenant isolé via `psychologist_id` sur toutes les tables. Defense en profondeur : filtre applicatif + contraintes DB.

---

# STRUCTURE DU PROJET

```
psyscale/
│
├── apps/
│   ├── web/                          ← Next.js App Router
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/          ← Espace psy
│   │   │   │   ├── layout.tsx        ← Sidebar + Topbar
│   │   │   │   ├── page.tsx          ← Dashboard home
│   │   │   │   ├── patients/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/page.tsx
│   │   │   │   │   └── new/page.tsx
│   │   │   │   ├── sessions/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/page.tsx
│   │   │   │   │   └── new/page.tsx
│   │   │   │   ├── calendar/page.tsx
│   │   │   │   ├── ai-assistant/page.tsx
│   │   │   │   ├── courses/
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   └── settings/
│   │   │   │       ├── profile/page.tsx
│   │   │   │       ├── practice/page.tsx
│   │   │   │       ├── billing/page.tsx
│   │   │   │       └── privacy/page.tsx
│   │   │   ├── (patient-portal)/     ← Espace patient
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── mood/page.tsx
│   │   │   │   ├── exercises/page.tsx
│   │   │   │   └── journal/page.tsx
│   │   │   ├── onboarding/
│   │   │   │   └── [step]/page.tsx
│   │   │   ├── error.tsx
│   │   │   ├── not-found.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                   ← shadcn/ui components
│   │   │   ├── layouts/
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── topbar.tsx
│   │   │   │   └── mobile-nav.tsx
│   │   │   ├── shared/
│   │   │   │   ├── data-table.tsx
│   │   │   │   ├── empty-state.tsx
│   │   │   │   ├── loading-skeleton.tsx
│   │   │   │   └── confirm-dialog.tsx
│   │   │   ├── patients/
│   │   │   ├── sessions/
│   │   │   │   └── session-note-editor.tsx  ← Composant critique
│   │   │   ├── ai/
│   │   │   │   └── ai-assist-panel.tsx
│   │   │   └── charts/
│   │   │
│   │   ├── lib/
│   │   │   ├── api/                  ← Fetch client vers NestJS
│   │   │   ├── auth/                 ← JWT storage, refresh
│   │   │   ├── ai/                   ← Vercel AI SDK hooks
│   │   │   └── stripe/
│   │   │
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-psychologist.ts
│   │   │   └── use-realtime.ts       ← Socket.io
│   │   │
│   │   ├── store/                    ← Zustand stores
│   │   │   ├── auth.store.ts
│   │   │   ├── ui.store.ts
│   │   │   └── notifications.store.ts
│   │   │
│   │   ├── types/
│   │   │   ├── api.ts                ← Types contrats API
│   │   │   └── index.ts
│   │   │
│   │   ├── constants/
│   │   │   ├── routes.ts
│   │   │   └── plans.ts
│   │   │
│   │   └── middleware.ts             ← Auth guard + redirects
│   │
│   └── api/                          ← NestJS backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── jwt.strategy.ts
│       │   │   └── guards/
│       │   ├── patients/
│       │   ├── sessions/
│       │   ├── calendar/
│       │   ├── courses/
│       │   ├── billing/
│       │   │   ├── billing.module.ts
│       │   │   ├── stripe.service.ts
│       │   │   └── webhook.controller.ts
│       │   ├── ai/
│       │   │   ├── ai.module.ts
│       │   │   ├── ai.service.ts
│       │   │   └── prompts/
│       │   │       ├── session-summary.prompt.ts
│       │   │       ├── exercise.prompt.ts
│       │   │       └── content.prompt.ts
│       │   ├── messaging/
│       │   │   └── messaging.gateway.ts  ← Socket.io
│       │   ├── notifications/
│       │   ├── analytics/
│       │   └── common/
│       │       ├── encryption.service.ts ← AES-256-GCM
│       │       ├── audit.service.ts
│       │       └── rate-limit.guard.ts
│       │
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
│
└── packages/
    └── shared-types/                 ← Types partagés web + api
```

---

# DATABASE SCHEMA (PostgreSQL + Prisma)

## Tables Core

### `users`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | text unique | |
| `password_hash` | text | Géré par NestJS Auth |
| `role` | enum | `psychologist` \| `patient` \| `admin` |
| `avatar_url` | text | |
| `locale` | text | défaut `fr` |
| `timezone` | text | défaut `Europe/Paris` |
| `last_sign_in_at` | timestamp | |
| `created_at` | timestamp | |

### `psychologists`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `name` | text | |
| `slug` | text unique | Pour profil public |
| `specialization` | text | |
| `bio` | text | |
| `phone` | text | |
| `address` | text | |
| `adeli_number` | text | **Obligatoire légal France** |
| `is_onboarded` | boolean | |
| `created_at` | timestamp | |

### `subscriptions`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK | |
| `stripe_customer_id` | text unique | |
| `stripe_subscription_id` | text unique | |
| `plan` | enum | `free` \| `starter` \| `pro` \| `clinic` |
| `status` | enum | `trialing` \| `active` \| `past_due` \| `canceled` |
| `trial_ends_at` | timestamp | |
| `current_period_end` | timestamp | |
| `cancel_at_period_end` | boolean | |

### `patients`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK | Tenant isolation |
| `user_id` | uuid FK → users | Null si pas de compte |
| `name` | text | |
| `email` | text | |
| `phone` | text | |
| `birth_date` | date | |
| `notes` | text | **Chiffré AES-256-GCM** |
| `status` | enum | `active` \| `inactive` \| `archived` |
| `source` | text | `direct` \| `referral` \| `online` |
| `created_at` | timestamp | |

### `sessions`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid FK | |
| `psychologist_id` | uuid FK | |
| `date` | timestamp | |
| `duration` | integer | Minutes |
| `type` | enum | `individual` \| `group` \| `online` |
| `notes` | text | **Chiffré AES-256-GCM** |
| `summary_ai` | text | Résumé généré IA |
| `tags` | text[] | Thèmes abordés |
| `rate` | numeric | Tarif séance |
| `payment_status` | enum | `pending` \| `paid` \| `free` |
| `created_at` | timestamp | |

### `appointments`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK | |
| `patient_id` | uuid FK | |
| `session_id` | uuid FK nullable | Lié après réalisation |
| `scheduled_at` | timestamp | |
| `duration` | integer | Minutes |
| `status` | enum | `scheduled` \| `confirmed` \| `cancelled` \| `completed` \| `no_show` |
| `reminder_sent_at` | timestamp | |

## Tables Patient Portal

### `mood_tracking`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid FK | |
| `mood` | integer | 1-10 |
| `note` | text | |
| `created_at` | timestamp | |

### `exercises`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid FK | |
| `title` | text | |
| `description` | text | |
| `status` | enum | `assigned` \| `in_progress` \| `completed` \| `skipped` |
| `created_by_ai` | boolean | |
| `due_date` | date | |
| `completed_at` | timestamp | |
| `patient_feedback` | text | |

### `journal_entries`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid FK | |
| `content` | text | **Chiffré AES-256-GCM** |
| `mood` | integer | 1-10 |
| `tags` | text[] | |
| `is_private` | boolean | Non visible psy si true |
| `created_at` | timestamp | |

## Tables Messaging

### `conversations`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK | |
| `patient_id` | uuid FK | |
| `created_at` | timestamp | |

### `messages`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `conversation_id` | uuid FK | |
| `sender_id` | uuid FK → users | |
| `content` | text | **Chiffré AES-256-GCM** |
| `read_at` | timestamp | |
| `created_at` | timestamp | |

## Tables Formations

### `courses`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK | |
| `title` | text | |
| `description` | text | |
| `price` | numeric | |
| `is_published` | boolean | |
| `created_at` | timestamp | |

### `course_modules`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `course_id` | uuid FK | |
| `title` | text | |
| `video_url` | text | OVH Object Storage HDS |
| `content` | text | |
| `order` | integer | |

### `course_enrollments`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `course_id` | uuid FK | |
| `user_id` | uuid FK → users | |
| `payment_id` | uuid FK | |
| `progress` | jsonb | `{ module_id: completed_at }` |
| `enrolled_at` | timestamp | |

## Tables Billing

### `payments`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK | |
| `patient_id` | uuid FK nullable | |
| `type` | enum | `session` \| `course` \| `subscription` |
| `amount` | numeric | |
| `status` | enum | `pending` \| `paid` \| `failed` |
| `stripe_payment_intent_id` | text | |
| `invoice_url` | text | |
| `created_at` | timestamp | |

### `invoices`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK | |
| `patient_id` | uuid FK nullable | |
| `invoice_number` | text unique | `PSY-2024-0001` |
| `amount_ttc` | numeric | TVA 0% (psys exonérés) |
| `status` | enum | `draft` \| `sent` \| `paid` |
| `issued_at` | date | |
| `pdf_url` | text | |

### `stripe_events`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `stripe_event_id` | text unique | Idempotency |
| `type` | text | |
| `processed_at` | timestamp | |

## Tables Compliance HDS

### `audit_logs`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `actor_id` | uuid FK → users | |
| `actor_type` | text | `psychologist` \| `patient` \| `system` |
| `action` | text | `READ` \| `CREATE` \| `UPDATE` \| `DELETE` \| `DECRYPT` |
| `entity_type` | text | `patient` \| `session` \| `notes` |
| `entity_id` | uuid | |
| `ip_address` | text | |
| `metadata` | jsonb | |
| `created_at` | timestamp | |

### `gdpr_consents`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patient_id` | uuid FK | |
| `type` | text | `data_processing` \| `ai_processing` \| `marketing` |
| `version` | text | `2024-01-v1` |
| `consented_at` | timestamp | |
| `withdrawn_at` | timestamp | |
| `ip_address` | text | |

## Tables Système

### `notifications`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `type` | text | `session_reminder` \| `mood_alert` \| `payment` \| `ai_complete` |
| `title` | text | |
| `body` | text | |
| `data` | jsonb | |
| `read_at` | timestamp | |
| `created_at` | timestamp | |

### `onboarding_progress`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK unique | |
| `steps_completed` | text[] | `profile` \| `first_patient` \| `first_session` \| `billing` |
| `completed_at` | timestamp | |

### `patient_invitations`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK | |
| `patient_id` | uuid FK | |
| `email` | text | |
| `token` | text unique | Token sécurisé |
| `status` | enum | `pending` \| `accepted` \| `expired` |
| `expires_at` | timestamp | |

### `ai_usage`
| Champ | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK | |
| `feature` | text | `session_summary` \| `exercise` \| `content` |
| `tokens_used` | integer | |
| `model` | text | |
| `cost_usd` | numeric | |
| `created_at` | timestamp | |

### Index PostgreSQL critiques
```sql
CREATE INDEX idx_patients_psychologist ON patients(psychologist_id);
CREATE INDEX idx_sessions_patient ON sessions(patient_id);
CREATE INDEX idx_sessions_psy_date ON sessions(psychologist_id, date DESC);
CREATE INDEX idx_mood_patient_date ON mood_tracking(patient_id, created_at DESC);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_appointments_psy_date ON appointments(psychologist_id, scheduled_at);
```

---

# API ROUTES (NestJS)

## Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Inscription psy |
| POST | `/auth/login` | Connexion → JWT |
| POST | `/auth/refresh` | Refresh token |
| POST | `/auth/logout` | Révocation token |

## Patients
| Method | Route | Description |
|---|---|---|
| GET | `/patients` | Liste paginée |
| POST | `/patients` | Créer patient |
| GET | `/patients/:id` | Fiche patient |
| PUT | `/patients/:id` | Modifier |
| DELETE | `/patients/:id` | Archiver |
| GET | `/patients/:id/export` | Export RGPD |
| DELETE | `/patients/:id/purge` | Suppression totale |

## Sessions
| Method | Route | Description |
|---|---|---|
| GET | `/sessions` | Liste avec filtres |
| POST | `/sessions` | Créer séance |
| GET | `/sessions/:id` | Détail séance |
| PUT | `/sessions/:id` | Modifier notes |
| POST | `/sessions/:id/ai-summary` | Déclencher résumé IA |

## Calendar
| Method | Route | Description |
|---|---|---|
| GET | `/appointments` | RDV par période |
| POST | `/appointments` | Créer RDV |
| PUT | `/appointments/:id` | Modifier |
| DELETE | `/appointments/:id` | Annuler |

## AI
| Method | Route | Description |
|---|---|---|
| POST | `/ai/session-summary` | Résumé structuré séance |
| POST | `/ai/generate-exercise` | Exercice personnalisé |
| POST | `/ai/generate-content` | LinkedIn \| newsletter \| blog |

## Billing
| Method | Route | Description |
|---|---|---|
| POST | `/billing/checkout` | Créer session Stripe |
| POST | `/billing/portal` | Portail client Stripe |
| GET | `/billing/subscription` | État abonnement |
| GET | `/billing/invoices` | Historique factures |
| POST | `/billing/webhooks/stripe` | **Webhooks Stripe** |

## Invitations
| Method | Route | Description |
|---|---|---|
| POST | `/invitations` | Inviter patient |
| GET | `/invitations/:token` | Valider token |
| POST | `/invitations/:token/accept` | Accepter |

## Notifications
| Method | Route | Description |
|---|---|---|
| GET | `/notifications` | Liste |
| PATCH | `/notifications/:id` | Marquer lu |
| POST | `/notifications/read-all` | Tout lire |

## Dashboard
| Method | Route | Description |
|---|---|---|
| GET | `/dashboard` | KPIs + stats |
| GET | `/analytics/revenue` | Revenus par période |
| GET | `/analytics/patients` | Évolution patients |

---

# DESIGN SYSTEM

## Palette (corrigée — accessible WCAG AA)

| Token | Hex | Contraste blanc | Usage |
|---|---|---|---|
| `--color-primary` | `#3D52A0` | 7.2:1 ✅ AAA | Boutons, liens actifs |
| `--color-primary-light` | `#7B9CDA` | 3.1:1 ✅ | Hover, backgrounds |
| `--color-accent` | `#0D9488` | 4.6:1 ✅ | Features IA, succès |
| `--color-warm` | `#7C3AED` | 5.4:1 ✅ | Formations, tags |
| `--color-bg` | `#F8F7FF` | — | Background app |
| `--color-surface` | `#F1F0F9` | — | Cards, sidebars |
| `--color-text` | `#1E1B4B` | 16.7:1 ✅ | Corps texte |

> ⚠️ `#A78BFA` de la palette initiale = **2.9:1 sur blanc → FAIL WCAG**. Remplacé par `#7C3AED`.

## Tokens humeur (mood tracking)
```css
--mood-5: #10B981;  /* Très bien */
--mood-4: #84CC16;  /* Bien — fond coloré uniquement */
--mood-3: #F59E0B;  /* Neutre — fond coloré uniquement */
--mood-2: #F97316;  /* Difficile */
--mood-1: #EF4444;  /* Très difficile */
```
> Toujours accompagner la couleur d'une icône ou label (daltonisme).

## Typographie
- **Inter** — body 16px minimum, labels 14px minimum
- Éléments interactifs : min 44×44px (WCAG 2.5.5)
- Focus outline : 3px solid `#3D52A0` + offset 2px — jamais supprimer

## Inspirations UI
Linear, Vercel, Notion, Stripe dashboard

## Règles UX
- Actions principales ≤ 3 clics
- Autosave obligatoire sur notes (toutes les 30s)
- Skeleton screens — jamais de spinner seul
- L'IA ne s'active **jamais automatiquement** — toujours opt-in
- Micro-copy chaleureuse (pas de messages système génériques)

---

# AI FEATURES

## 1. Résumé automatique de séance
- **Input :** notes brutes du psy
- **Output :** résumé structuré + plan thérapeutique + points de suivi
- **Endpoint :** `POST /ai/session-summary` (streaming)
- **Stockage :** `sessions.summary_ai`
- **Disclaimer obligatoire :** "Outil d'aide — le praticien reste responsable"
- **Consent :** les notes ne quittent jamais le serveur sans consentement explicite

## 2. Exercices thérapeutiques personnalisés
- **Input :** profil patient + thématique
- **Output :** respiration / journal de pensées / exposition progressive
- **Endpoint :** `POST /ai/generate-exercise`
- **Stockage :** table `exercises` avec `created_by_ai = true`

## 3. Marketing automatique
- **Input :** thème anonymisé (jamais données patients)
- **Output :** post LinkedIn / newsletter / article blog
- **Endpoint :** `POST /ai/generate-content`
- **Types :** `linkedin` | `newsletter` | `blog`

---

# PRICING

| Plan | Prix | Patients | Séances | IA | Formations |
|---|---|---|---|---|---|
| **Starter** | 49€/mois | 20 | 40/mois | 10 résumés | ✗ |
| **Pro** | 97€/mois | Illimité | Illimité | 100 résumés | 5 formations |
| **Clinic** | 197€/mois | Illimité | Illimité | Illimité | Illimité + multi-praticiens |

---

# SÉCURITÉ

### Chiffrement applicatif (NestJS `EncryptionService`)
```
Algorithme : AES-256-GCM
Champs chiffrés : notes, summary_ai, messages.content, journal_entries.content
Clé : variable d'environnement, rotatable
Format stocké : iv:authTag:encrypted
```

### Auth (Keycloak + OIDC)
- Access token JWT : 15 minutes (signé par Keycloak)
- Refresh token : 8 heures
- MFA obligatoire pour rôle `psychologist` (TOTP)
- Rate limiting auth : géré par Keycloak (brute force protection native)
- Rate limiting IA : 5 req / min / tenant (NestJS BullMQ)
- Audit events Keycloak → table `audit_logs` PostgreSQL

### Multi-tenant isolation
- Filtre `psychologist_id` systématique sur toutes les queries
- Double protection : filtre applicatif + contrainte DB
- Jamais de query sans tenant context

### HTTP Security Headers (next.config.ts)
```
Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options,
Content-Security-Policy, Referrer-Policy, Permissions-Policy
```

---

# FLOWS UX PRIORITAIRES

## Onboarding (5 étapes, max 3 min)
1. Profil praticien (nom, ADELI, spécialité)
2. Cabinet (adresse, tarif séance)
3. Préférences (format notes, durée séance)
4. Premier patient (optionnel — "Ajouter plus tard")
5. Succès + 3 quick actions

## Création patient (≤ 2 clics depuis dashboard)
- Modal slide-in, pas de navigation
- Champs obligatoires MVP : Prénom + Nom uniquement
- Progressive disclosure pour les autres infos

## Note de séance (core loop quotidien)
- Autosave 30s + Ctrl+S
- MoodSelector 5 niveaux (clic, pas slider)
- Bouton "Assistant IA" opt-in, non intrusif
- Shortcut : Cmd+N = nouvelle séance

## Mobile-first prioritaire
- Note séance, Dashboard, Liste patients, Notifications
- Bottom nav bar (4 items) + FAB "+"
- Éditeur mobile : toolbar condensée en bas

---

# ROADMAP

## Phase 1 — Fondations (Semaine 1)
- [ ] `middleware.ts` Next.js (auth guard + redirects)
- [ ] NestJS bootstrap (auth JWT, modules, Prisma)
- [ ] Schema Prisma complet + migrations
- [ ] `EncryptionService` AES-256-GCM
- [ ] `AuditService` (trigger sur tables sensibles)
- [ ] Types TypeScript partagés

## Phase 2 — MVP Core (Semaines 2-4)
- [ ] Auth + Onboarding wizard
- [ ] CRUD Patients + fiche détaillée
- [ ] Session Notes + autosave
- [ ] Résumé IA séance (streaming)
- [ ] Dashboard KPIs

## Phase 3 — Monétisation (Semaines 5-7)
- [ ] Stripe subscriptions + webhooks
- [ ] Feature flags par plan
- [ ] Invitations patients → espace patient
- [ ] Exercices IA + mood tracking

## Phase 4 — Croissance (Semaines 8-12)
- [ ] Plateforme formations + paiement
- [ ] Marketing IA (LinkedIn, newsletter, blog)
- [ ] Analytics dashboard (MRR, rétention)
- [ ] Notifications in-app + emails (Resend)
- [ ] Facturation PDF

---

# RÈGLES ABSOLUES

1. **Ne jamais** stocker `password_hash` dans une table publique (géré par NestJS Auth)
2. **Ne jamais** exposer des données patients dans les logs Sentry
3. **Ne jamais** envoyer des notes de séance à un LLM sans consentement explicit
4. **Ne jamais** commencer le code sans `middleware.ts` + `EncryptionService` en place
5. **Toujours** filtrer par `psychologist_id` sur toutes les queries patients/sessions
6. **Toujours** valider les inputs avec des Zod schemas avant traitement
7. **Toujours** loguer dans `audit_logs` les accès aux données chiffrées

---

# GOAL FINAL

**1 000 psychologues payants. Infrastructure HDS. Conforme RGPD.**

Le "Doctolib + Kajabi + Notion + ChatGPT" pour psychologues — **PsyScale**.
