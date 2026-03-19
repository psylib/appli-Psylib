# PsyLib API

Backend NestJS pour la plateforme PsyLib — gestion de cabinet pour psychologues libéraux. Conforme HDS, chiffrement AES-256-GCM des données de santé, authentification Keycloak OIDC avec MFA obligatoire.

## Stack

| Composant | Version |
|---|---|
| NestJS | 10.x |
| Prisma ORM | 5.x |
| PostgreSQL | 16 |
| Redis / BullMQ | 7.x |
| Node.js | >= 20 |
| TypeScript | 5.x (strict) |
| Keycloak | 24 (OIDC — HDS) |
| Stripe | 14.x |
| Resend | 6.x |
| Socket.io | 4.x |
| Sentry | 8.38 |

## Démarrage local

### Prérequis

- Docker Desktop en cours d'exécution
- pnpm >= 9
- Node.js >= 20

### Lancer l'environnement

```bash
# Depuis la racine du monorepo
cd C:/Users/tonyr/OneDrive/Projet/PsyFlow

# Démarrer PostgreSQL, Redis, Keycloak, Mailhog
docker compose up -d

# Installer les dépendances
pnpm install

# Générer le client Prisma
pnpm --filter @psyscale/api exec prisma generate

# Lancer l'API en mode watch
pnpm --filter @psyscale/api dev
```

L'API démarre sur `http://localhost:4000`.
Swagger disponible sur `http://localhost:4000/api/docs` (désactivé en production).

### Fichier d'environnement

Créer `apps/api/.env.local` à partir des variables listées ci-dessous.

## Variables d'environnement

### Base de données

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://psyscale:***@localhost:5432/psyscale` |

### Redis / BullMQ

| Variable | Description | Défaut |
|---|---|---|
| `REDIS_HOST` | Hôte Redis | `localhost` |
| `REDIS_PORT` | Port Redis | `6379` |
| `REDIS_PASSWORD` | Mot de passe Redis (optionnel en dev) | — |

### Keycloak (OIDC — HDS obligatoire)

| Variable | Description |
|---|---|
| `KEYCLOAK_URL` | URL de l'instance Keycloak (`https://auth.psylib.eu`) |
| `KEYCLOAK_REALM` | Realm Keycloak (`psyscale`) |
| `KEYCLOAK_CLIENT_ID` | Client ID de l'application |
| `KEYCLOAK_CLIENT_SECRET` | `***` |
| `KEYCLOAK_ADMIN_CLIENT_ID` | Client ID admin (provisioning) |
| `KEYCLOAK_ADMIN_SECRET` | `***` |

### Stripe

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | `***` |
| `STRIPE_WEBHOOK_SECRET` | Secret de validation des webhooks (`whsec_***`) |
| `STRIPE_REFERRAL_COUPON_ID` | ID du coupon Stripe pour le parrainage |

### Email (Resend)

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | `***` |
| `RESEND_FROM_EMAIL` | Adresse expéditeur (`noreply@psylib.eu`) |

### IA (Anthropic)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | `***` |

### Chiffrement HDS

| Variable | Description |
|---|---|
| `ENCRYPTION_KEY` | Clé AES-256-GCM (64 caractères hex) — `***` |

### Application

| Variable | Description | Défaut |
|---|---|---|
| `NODE_ENV` | Environnement (`development` / `production`) | `development` |
| `PORT` | Port d'écoute | `4000` |
| `FRONTEND_URL` | URL du frontend (CORS) | `http://localhost:3000` |
| `SENTRY_DSN` | DSN Sentry pour le monitoring (`***`) | — |

## Structure des modules

| Module | Rôle |
|---|---|
| `auth` | Stratégie Keycloak JWT, auto-provisioning User/Psychologist au premier login |
| `common` | Services transversaux : PrismaService, EncryptionService (AES-256-GCM), AuditService, cache |
| `health` | Endpoint `GET /api/v1/health` pour monitoring infra |
| `patients` | CRUD patients, export RGPD, purge données, filtrage strict par `psychologist_id` |
| `sessions` | Notes de séance (chiffrées), résumé IA, tags thérapeutiques |
| `appointments` | Gestion des rendez-vous, statuts, rappels J-1 |
| `availability` | Créneaux disponibles pour la prise de RDV en ligne |
| `public-booking` | Réservation publique via profil `/psy/[slug]`, confirm/decline |
| `dashboard` | KPIs agrégés : patients actifs, séances, revenus |
| `analytics` | Analytics avancées : revenus par période, évolution patients, humeur |
| `onboarding` | Progression wizard onboarding (5 étapes) |
| `ai` | Résumé de séance, génération d'exercices, contenu marketing (Claude) |
| `billing` | Stripe subscriptions, checkout, portail client, webhooks |
| `invoices` | Génération PDF factures, numérotation `PSY-YYYY-XXXX` |
| `patient-portal` | API espace patient : humeur, exercices, journal (chiffré) |
| `notifications` | Notifications in-app, marquer lu, bulk read |
| `messaging` | Messagerie temps réel via Socket.io Gateway (chiffrée) |
| `courses` | Formations créées par les psys, modules vidéo, inscriptions |
| `outcomes` | Suivi des résultats thérapeutiques (outcome tracking) |
| `note-templates` | Templates de notes réutilisables |
| `network` | Réseau professionnel entre psychologues |
| `matching` | Matching patient-psychologue (`GET /public/psy/match`) |
| `leads` | Capture et gestion des leads entrants |
| `supervision` | Module supervision/intervision entre praticiens |
| `referral` | Programme de parrainage (ReferralInvite, coupon Stripe) |
| `admin` | Backoffice PsyLib : outbound ADELI, import CSV, templates admin |

## Commandes utiles

```bash
# Développement
pnpm --filter @psyscale/api dev               # Mode watch
pnpm --filter @psyscale/api build             # Build production
pnpm --filter @psyscale/api start             # Lancer le build (node dist/main)

# Tests
pnpm --filter @psyscale/api test              # Vitest (run once)
pnpm --filter @psyscale/api test:watch        # Vitest en mode watch
pnpm --filter @psyscale/api test:coverage     # Avec couverture de code

# TypeScript
pnpm --filter @psyscale/api type-check        # tsc --noEmit

# Prisma
pnpm --filter @psyscale/api exec prisma generate          # Générer le client
pnpm --filter @psyscale/api exec prisma migrate dev       # Appliquer migrations (dev)
pnpm --filter @psyscale/api exec prisma migrate deploy    # Appliquer migrations (prod)
pnpm --filter @psyscale/api exec prisma studio            # Interface graphique DB

# Depuis la racine du monorepo
pnpm build     # Build toutes les apps (Turborepo)
pnpm test      # Tests toutes les apps
pnpm lint      # Lint toutes les apps
```

## Sécurité et HDS

### Chiffrement applicatif

Les champs contenant des données de santé sont chiffrés en AES-256-GCM via `EncryptionService` avant persistance en base :

- `sessions.notes`
- `sessions.summary_ai`
- `patients.notes`
- `messages.content`
- `journal_entries.content`

Format stocké : `iv:authTag:encrypted` (base64).

### Authentification

- Keycloak 24 hébergé sur OVH HDS (OIDC Authorization Code Flow)
- JWT Access Token valide 15 minutes, Refresh Token 8 heures
- MFA TOTP obligatoire pour le rôle `psychologist`
- Auto-provisioning : à la première connexion Keycloak, `User` + `Psychologist` sont créés automatiquement via `provisionUser()` dans la stratégie JWT

### Isolation multi-tenant

Chaque psychologue est un tenant isolé. Toutes les queries sont filtrées par `psychologist_id` au niveau applicatif (double protection avec contraintes DB).

### Audit logs

Chaque accès aux données sensibles est loggé dans la table `audit_logs` via `AuditInterceptor` : acteur, action (`READ` / `CREATE` / `UPDATE` / `DELETE` / `DECRYPT`), entité, IP, timestamp.

### Rate limiting

Trois niveaux configurés via `@nestjs/throttler` :
- `short` : 10 req / 1s
- `medium` : 50 req / 10s
- `long` : 200 req / 60s

### Headers de sécurité

Helmet configuré avec CSP stricte, HSTS (max-age 1 an, includeSubDomains, preload), CORS restreint aux origines connues.

## Déploiement

### Environnement de production

- Hôte : VPS OVH (`51.178.31.68`)
- Port : `4000`
- `NODE_ENV=production` (Swagger désactivé, logs réduits à `error` + `warn`)
- Swagger désactivé automatiquement en production

### Build Docker (depuis VPS)

```bash
ssh ubuntu@51.178.31.68 -i ~/.ssh/psyscale_ovh

cd /opt/psyscale-api

# Le contexte de build est le monorepo complet (build-ctx/)
docker build -f Dockerfile -t psyscale-api:latest build-ctx/

docker compose up -d --no-build api
```

Note : le `Dockerfile` runner nécessite `apk add --no-cache openssl` (Prisma OpenSSL 3.x sur Alpine).

### Upload de fichiers modifiés

```bash
# Uploader un fichier source modifié
scp -i ~/.ssh/psyscale_ovh apps/api/src/module/file.ts ubuntu@51.178.31.68:/opt/psyscale-api/build-ctx/apps/api/src/module/

# Toujours uploader schema.prisma si le schéma a changé
scp -i ~/.ssh/psyscale_ovh apps/api/prisma/schema.prisma ubuntu@51.178.31.68:/opt/psyscale-api/build-ctx/apps/api/prisma/
```

### Vérification santé API

```bash
curl https://api.psylib.eu/api/v1/health
```

### Backups PostgreSQL

Cron automatique à 2h00 (Europe/Paris), rétention 7 jours, stockage dans `/opt/psyscale-api/backups/`.
