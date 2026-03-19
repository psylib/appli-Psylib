# PsyLib Web

Frontend Next.js 14 App Router pour la plateforme PsyLib. Interface de gestion de cabinet pour psychologues libéraux, espace patient, profil public et prise de RDV en ligne.

## Stack

| Composant | Version |
|---|---|
| Next.js (App Router) | 14.2.35 |
| React | 18.x |
| TypeScript | 5.x (strict) |
| TailwindCSS | 3.x |
| next-auth | 5.0.0-beta.30 (Keycloak OIDC) |
| React Query | 5.x |
| Zustand | 4.x |
| React Hook Form | 7.x |
| Zod | 3.x |
| Socket.io-client | 4.x |
| Sentry | 8.38 |
| PostHog | 1.x |

## Démarrage local

### Prérequis

- L'API et les services Docker doivent être démarrés (`docker compose up -d` depuis la racine)
- pnpm >= 9
- Node.js >= 20

### Lancer le frontend

```bash
# Depuis la racine du monorepo
cd C:/Users/tonyr/OneDrive/Projet/PsyFlow

# Installer les dépendances (si pas déjà fait)
pnpm install

# Créer le fichier d'environnement local
cp apps/web/.env.example apps/web/.env.local
# (éditer .env.local avec les vraies valeurs)

# Lancer en développement
pnpm --filter @psyscale/web dev
# ou depuis la racine :
pnpm dev
```

Le frontend démarre sur `http://localhost:3000`.

## Variables d'environnement

Créer `apps/web/.env.local` avec les variables suivantes.

### API

| Variable | Description | Exemple |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL de l'API NestJS | `http://localhost:4000/api/v1` |

### Auth (next-auth + Keycloak OIDC)

| Variable | Description |
|---|---|
| `NEXTAUTH_URL` | URL du frontend (`http://localhost:3000` en dev, `https://psylib.eu` en prod) |
| `NEXTAUTH_SECRET` | Secret de signature des sessions (`***`) |
| `KEYCLOAK_URL` | URL de l'instance Keycloak (`https://auth.psylib.eu`) |
| `KEYCLOAK_REALM` | Realm Keycloak (`psyscale`) |
| `KEYCLOAK_CLIENT_ID` | Client ID Next.js |
| `KEYCLOAK_CLIENT_SECRET` | `***` |

### Analytics et monitoring

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Clé publique PostHog (`phc_***`) |
| `NEXT_PUBLIC_POSTHOG_HOST` | Host PostHog (`https://app.posthog.com`) |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN Sentry frontend (`***`) |
| `SENTRY_AUTH_TOKEN` | Token pour upload des source maps Sentry (`***`) |

### Support

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CRISP_WEBSITE_ID` | ID du widget Crisp (support in-app) |

### Stripe (côté client)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (`pk_live_***`) |

## Structure des pages

### Routes publiques

| Route | Description |
|---|---|
| `/` | Page d'accueil marketing |
| `/trouver-mon-psy` | Moteur de matching patient-psychologue |
| `/psy/[slug]` | Profil public d'un psychologue + prise de RDV |
| `/psy/[slug]/confirmation` | Confirmation de réservation (page émotionnelle) |
| `/ambassadeurs` | Formulaire de candidature programme ambassadeurs |
| `/blog` | Blog SEO |
| `/guides/[slug]` | 30+ guides SEO long-tail |
| `/fonctionnalites/[slug]` | Pages features SEO |
| `/outils/calculateur-revenus` | Calculateur de revenus pour psys |
| `/psychologue-[ville]` | 10 pages SEO locales (Paris, Lyon, Marseille, etc.) |

### Routes authentifiées — Dashboard psychologue (`/dashboard/...`)

| Route | Description |
|---|---|
| `/dashboard` | Vue d'ensemble : KPIs, prochains RDV, activité récente |
| `/dashboard/patients` | Liste patients + création |
| `/dashboard/patients/[id]` | Fiche patient détaillée |
| `/dashboard/sessions` | Historique des séances |
| `/dashboard/sessions/[id]` | Détail séance avec notes chiffrées et résumé IA |
| `/dashboard/calendar` | Agenda et gestion des rendez-vous |
| `/dashboard/messages` | Messagerie sécurisée temps réel |
| `/dashboard/ai-assistant` | Assistant IA (résumé, exercices, contenu marketing) |
| `/dashboard/analytics` | Analytics : revenus, patients, humeur |
| `/dashboard/invoices` | Facturation et génération PDF |
| `/dashboard/courses` | Gestion des formations créées |
| `/dashboard/outcomes` | Suivi des résultats thérapeutiques |
| `/dashboard/note-templates` | Templates de notes réutilisables |
| `/dashboard/network` | Réseau professionnel entre psys |
| `/dashboard/supervision` | Supervision et intervision |
| `/dashboard/notifications` | Centre de notifications |
| `/dashboard/referral` | Programme de parrainage |
| `/dashboard/settings/profile` | Profil public et informations praticien |
| `/dashboard/settings/billing` | Abonnement Stripe, changement de plan |
| `/dashboard/settings/privacy` | Paramètres RGPD et confidentialité |
| `/dashboard/admin` | Backoffice admin (outbound ADELI, import CSV) |

### Routes authentifiées — Espace patient (`/patient-portal/...`)

| Route | Description |
|---|---|
| `/patient-portal` | Dashboard patient |
| `/patient-portal/mood` | Suivi humeur quotidien |
| `/patient-portal/exercises` | Exercices assignés par le psy |
| `/patient-portal/journal` | Journal privé (chiffré) |
| `/patient-portal/assessments` | Évaluations et questionnaires |

### Routes onboarding

| Route | Description |
|---|---|
| `/onboarding/[step]` | Wizard d'onboarding 5 étapes (profil, cabinet, préférences, patient, succès) |

### Routes API Next.js (`/api/...`)

| Route | Description |
|---|---|
| `/api/auth/[...nextauth]` | Handlers next-auth (OIDC callback, session, logout) |

## Déploiement

Le frontend est déployé sur **Vercel**. Le déploiement doit toujours être lancé depuis la **racine du monorepo**, pas depuis `apps/web`.

```bash
# Depuis la racine du monorepo
cd C:/Users/tonyr/OneDrive/Projet/PsyFlow

npx vercel --prod
```

Les variables d'environnement de production sont configurées dans le dashboard Vercel du projet `psyscale/web`.

URL de production : `https://psylib.eu`

## Commandes utiles

```bash
# Développement
pnpm --filter @psyscale/web dev          # Démarre sur :3000

# Build
pnpm --filter @psyscale/web build        # Build Next.js production
pnpm --filter @psyscale/web start        # Lancer le build local

# Qualité
pnpm --filter @psyscale/web lint         # ESLint
pnpm --filter @psyscale/web type-check   # tsc --noEmit

# Depuis la racine (Turborepo — toutes les apps)
pnpm build
pnpm lint
pnpm type-check
```

## Notes importantes

### App Router (Next.js 14)

- Toutes les routes du dashboard sont dans le groupe `(dashboard)/dashboard/xxx/` — une route hors de ce groupe provoquerait un 404 avec le middleware d'auth.
- Les Server Components sont utilisés pour le fetch de données initiales ; les Client Components (`"use client"`) pour l'interactivité et les hooks.
- Les métadonnées SEO sont définies via `export const metadata` ou `generateMetadata()` dans chaque `page.tsx` / `layout.tsx`.
- `metadataBase` est défini dans le `layout.tsx` racine sur `https://psylib.eu` — requis pour les URLs absolues dans les balises Open Graph.

### Authentification (next-auth v5 beta)

- Provider Keycloak OIDC configuré dans `apps/web/src/auth.ts`.
- Le middleware `middleware.ts` protège toutes les routes `/dashboard/` et `/patient-portal/` : redirection vers `/login` si la session est absente ou expirée.
- Utiliser `user.sub` (pas `user.psychologistId`) pour identifier l'utilisateur dans les appels API.

### Formulaires

- Pattern systématique : `React Hook Form` + `zodResolver` + `z.string()` avec `defaultValues` dans `useForm`.
- Ne pas utiliser `.optional().default('')` dans les schémas Zod combinés avec `useForm` (conflits de types).

### Apostrophes dans JSX

- Utiliser des guillemets doubles pour les strings contenant des apostrophes : `"l'annuaire"` plutôt que `{'l\'annuaire'}`.

### Données sensibles

- PostHog ne collecte jamais de données patients — analytics produit réservé aux actions des psychologues.
- Sentry filtre les données de requêtes avant envoi (configuré dans `instrumentation.ts`).
