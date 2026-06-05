# Audit complet PsyLib — 2026-06-05

> Audit multi-agents (12 dimensions, 33 agents, vérification adversariale de chaque finding critique/élevé).
> 82 findings retenus — **0 faux positif** après vérification. Plusieurs sévérités revues à la baisse vs. l'évaluation initiale.

## Notes globales /10

| Axe | Note | Commentaire |
|---|---|---|
| **Sécurité (auth/tenant/crypto)** | 6.5 | Fondations solides, aucun IDOR cross-tenant exploitable. Faiblesses systémiques (audience JWT, pas de guard global). |
| **Backend** | 6 | Architecture mature mais bugs déterministes à fort impact (Stripe, double-booking, factures). |
| **Frontend** | 6 | Bonne base, mais gating onboarding cassé, CSP permissive, A11y WCAG non tenue. |
| **Conformité HDS/RGPD** | 4.5 | **Point le plus faible et le plus dangereux** — Scribe sans consentement backend, audit DECRYPT troué. |
| **DevOps/Infra** | 5.5 | Prod durcie mais SPOF total, secrets bakés dans l'image, aucun scan CI. |
| **GLOBAL** | **5.5** | Au-dessus de la moyenne pour un solo dev, mais des écarts existentiels sur la promesse HDS. |

## Répartition par sévérité

- 🔴 **Critique : 1**
- 🟠 **Élevé : 7**
- 🟡 **Moyen : 43**
- 🔵 **Faible : 23**
- ⚪ **Info : 8**

---

## 🔴 CRITIQUE (à neutraliser AVANT tout nouveau client)

### C1 — AI Scribe : séances entières envoyées à des LLM US sans consentement vérifié backend
- **Fichiers** : `apps/api/src/video/video.service.ts:919-964`, `apps/api/src/video/scribe.service.ts:58-129`
- **Problème** : `uploadScribeAudio()` ne vérifie que `scribeEnabled` (réglage psy), puis envoie l'audio à OpenAI Whisper et la transcription intégrale à OpenRouter. **Le consentement patient n'est qu'affiché en UI** — aucune vérification serveur. Seule garde : `if (!room.scribeEnabled) throw`.
- **Impact** : transmission d'une conversation thérapeutique (donnée de santé L.1111-8 CSP) à 2 sous-traitants hors UE sans consentement. Violation règle absolue CLAUDE.md #3 + RGPD art. 9. Risque CNIL jusqu'à 20M€/4% CA.
- **Correctif** : avant `scribeQueue.add()`, exiger un `gdprConsent { patientId, type:'ai_video_transcription', withdrawnAt:null }` → `ForbiddenException` sinon (modèle `AiService.checkAiConsent`). Refuser le Scribe sur salles instant sans patient. Bloquer `enableScribe` tant que le consentement n'est pas enregistré.

---

## 🟠 ÉLEVÉ

### H1 — Webhook Stripe : event marqué traité AVANT traitement → perte définitive si le job échoue
- **Fichier** : `apps/api/src/billing/webhook.controller.ts:59-92`
- **Problème** : la ligne `stripeEvent` (idempotence) est créée AVANT l'enqueue. Si le job épuise ses 3 retries, l'event est considéré « traité » pour toujours, court-circuité au renvoi.
- **Impact** : désync permanente DB↔Stripe — abonnement non activé alors que payé, facture/RDV jamais marqué payé. Intervention manuelle requise. **Impacte le revenu.**
- **Correctif** : insérer avec `status='received'`, marquer `processed`/`processedAt` dans le worker APRÈS succès ; le court-circuit ne doit ignorer que les `processed`. Ajouter un listener BullMQ `failed` → Sentry + dead-letter.

### H2 — Résumé IA déchiffre jusqu'à 15 séances sans audit DECRYPT
- **Fichier** : `apps/api/src/ai/ai.service.ts:172-185` (`collectPatientHistory`)
- **Problème** : déchiffre `summaryAi`/`notes` de 15 séances pour le LLM sans `audit.logDecrypt()` (contrairement à `patients.service.ts:159`).
- **Impact** : accès en clair à des données de santé non tracé. Viole règle HDS #7. En contrôle CNIL : impossible de prouver qui a déchiffré quoi.
- **Correctif** : `logDecrypt(...)` par séance déchiffrée (ou log agrégé listant les `sessionIds` en metadata).

### H3 — Exports RGPD et CSV de masse déchiffrent sans audit DECRYPT
- **Fichier** : `apps/api/src/patients/patients.service.ts:586-616` (`exportAllCsv`), `620-693` (`exportPatientRgpd`)
- **Problème** : déchiffre tout le dossier patient (notes, sessions, assessments) sans `logDecrypt`. `exportAllCsv` n'écrit aucun audit.
- **Impact** : l'accès le plus sensible (export complet) non tracé comme déchiffrement. Non-conformité HDS/RGPD.
- **Correctif** : `audit.log({action:'DECRYPT', entityType:'patient_export', entityId, metadata})` + transmettre `req` depuis le controller. Audit `READ patient_export_bulk` pour le CSV.

### H4 — Tests d'intégration factices : faux signal vert sur les protections HDS
- **Fichiers** : `apps/api/src/__tests__/integration/patients.integration.spec.ts:58-128`, `auth.integration.spec.ts:41-100`, `billing.integration.spec.ts:47-60`
- **Problème** : les suites « intégration » ré-implémentent des guards/services factices inline (`TenantPatientsService`, `MockAuthGuard`, `MockRolesGuard` avec rôles codés en dur) au lieu d'exercer `PatientsService`/`KeycloakGuard`/`RolesGuard`/`SubscriptionGuard` réels.
- **Impact** : une régression d'isolation tenant ou de RBAC ne ferait échouer **aucun** test. Le filet de sécurité est une illusion.
- **Correctif** : réécrire avec `Test.createTestingModule` important les vrais providers, seuls Prisma + JWKS mockés au plus bas niveau.

### H5 — Gating onboarding cassé : `redirect()` avalé par try/catch
- **Fichiers** : `apps/web/src/app/(dashboard)/layout.tsx:31`, `apps/web/src/app/onboarding/layout.tsx:32`
- **Problème** : `redirect()` lève `NEXT_REDIRECT`, interceptée par le `catch {}` vide → la redirection ne s'exécute jamais.
- **Impact** : un psy non-onboardé accède au dashboard dans un état incohérent ; un psy onboardé n'est pas renvoyé hors de /onboarding. Bug net au cœur du funnel d'activation.
- **Correctif** : sortir `redirect()` du try/catch (stocker un booléen, rediriger après le bloc), ou re-throw si `isRedirectError`.

### H6 — Double-booking : détection de chevauchement défaillante
- **Fichier** : `apps/api/src/public-booking/public-booking.service.ts:392-409`
- **Problème** : `findFirst` sans `orderBy` ni borne de fin → peut retourner un RDV non-conflictuel et laisser passer un vrai chevauchement. La transaction Serializable ne protège pas une requête logiquement incorrecte.
- **Impact** : 2 patients réservent le même créneau. Déterministe dès qu'un psy a plusieurs RDV.
- **Correctif** : requête d'overlap correcte sur les 2 bornes (`existing.scheduledAt < newEnd AND endsAt > scheduledAt`) — stocker `endsAt` indexé, ou contrainte d'exclusion PostgreSQL `EXCLUDE USING gist (... tsrange(...) WITH &&)`.

### H7 — CI : seuils de couverture jamais appliqués + intégration en continue-on-error + E2E jamais exécutés
- **Fichiers** : `.github/workflows/ci.yml:80-92`, `apps/api/vitest.config.ts:12-17`
- **Problème** : `vitest run` sans `--coverage` (thresholds ignorés), intégration en `continue-on-error`, tests web skippés, 15 specs Playwright jamais lancées.
- **Impact** : la CI passe au vert avec couverture en chute, intégration cassée, zéro E2E. Parcours critiques (booking/paiement/visio) non validés.
- **Correctif** : `vitest run --coverage`, retirer `continue-on-error` (après fiabilisation), job Playwright dédié, relever seuils à 60-70% sur common/auth/patients/billing/ai.

---

## 🟡 MOYEN (43) — regroupés par thème

### Sécurité auth & tenant
- **JWT Keycloak : audience (aud/azp) jamais validée** — `auth/keycloak-jwt.strategy.ts:49-59`. Tout token du realm `psyscale` est accepté quel que soit le client OIDC. → ajouter `audience:'psyscale-app'` / valider `azp`.
- **Aucune garde d'auth globale** — `app.module.ts:159`. Sécurité 100% opt-in par controller (fail-open). → `KeycloakGuard` en `APP_GUARD` + décorateur `@Public()`.
- **Access token patient : `patientId` non revérifié** contre l'user — `patient-portal/strategies/patient-jwt.strategy.ts:26-37`. Defense-in-depth manquante (le refresh le fait déjà).
- **Secret JWT patient/guardian partagé via fallback** — `guardian-portal/strategies/guardian-jwt.strategy.ts:21`. → `getOrThrow('GUARDIAN_JWT_SECRET')`.
- **next-auth 5.0.0-beta.31 en prod** — `apps/web/package.json`. Beta gérant l'auth de données de santé.

### Chiffrement / données
- **Note d'humeur renvoyée en ciphertext au psy** — `patients.service.ts:353-357`. Donnée clinique illisible + pas de logDecrypt.
- **Note d'humeur non déchiffrée dans l'export RGPD** — `patients.service.ts:672-676`. Export non conforme art.15/20.

### Conformité HDS/RGPD
- **AuditInterceptor ne logue jamais DECRYPT** — `common/audit.interceptor.ts:36-75`. Complétude dépend d'appels manuels (déjà 3 oublis). → centraliser via `EncryptionService.decryptAudited()`.
- **Purge RGPD supprime la preuve de consentement** (cascade `gdpr_consents`) — `schema.prisma:1115`. Viole art.7.1 (démontrer le consentement). → archiver pseudonymisé avant delete.
- **Consentement IA : périmètre temporel ambigu** — `ai.service.ts:281`. Historique antérieur à un retrait/re-consentement ré-envoyé au LLM.

### Injection / uploads
- **XSS stocké via JSON-LD profil psy public** — `psy/[slug]/page.tsx:57-81`. `JSON.stringify` n'échappe pas `</script>`. → helper `safeJsonLd()`.
- **Upload justificatif dépense sans magic-bytes** — `expenses.service.ts:257-298`. Incohérent avec module documents.
- **xlsx@0.18.5 (SheetJS)** — prototype pollution + ReDoS, fichiers uploadés par les psys (voir Deps).

### Backend
- **Queue BullMQ billing sans defaultJobOptions** — `billing.module.ts:16`. Accumulation Redis illimitée, pas de dead-letter.
- **Numérotation facture cassée >999** (tri lexicographique) — `invoices.service.ts:101-119` + `createAutoInvoice:359-370`. Bloque la facturation à l'échelle. → séquence atomique / champ `Int`.
- **Crons @Cron sans verrou distribué** — `reminder.service.ts:17`, `public-booking.service.ts:599`, `trial-expiry.cron.ts:20`. Doubles emails/SMS en multi-instance. → BullMQ repeatable jobs / Redlock / claim atomique.

### Database
- **onDelete:Cascade sur Appointment/Session.patientId** — `schema.prisma:797,641`. Purge patient efface l'historique lié aux pièces comptables (conservation 6-10 ans). → pseudonymiser si Invoice/AccountingEntry existent.
- **PII `Lead.ip` jamais purgée** malgré rétention 30j documentée — `schema.prisma:1254-1262`. → cron d'anonymisation.

### Frontend Next.js
- **CSP autorise `unsafe-inline` + `unsafe-eval`** — `next.config.mjs:50`. Protection XSS quasi nulle. → nonces, retirer `unsafe-eval` en prod.
- **JWT d'accès exposé au JS client** — `auth.config.ts:208` (+~80 fichiers). → pattern BFF (Route Handlers).
- **Tokens patient/tuteur jamais rafraîchis** — `auth.config.ts:141-155`. 401 silencieux ou fenêtre 8h.

### React / Accessibilité (WCAG AA exigée)
- **MoodSelector du SessionNoteEditor jamais persisté** — `session-note-editor.tsx:203,255-272`. Perte de donnée clinique silencieuse. → câbler `selectedMood` dans le payload ou retirer.
- **Focus invisible textarea journal patient** — `journal/page.tsx:171` (`focus:outline-none`). Viole l'exigence focus 3px.
- **Dialog sans focus trap ni restauration**, `aria-labelledby` cassé via ConfirmDialog — `ui/dialog.tsx:17-75`.
- **Dropdowns sans Escape ni gestion focus** — `notification-bell.tsx:43-220`.
- **Sélecteurs humeur emoji <44px + sans nom accessible** — `journal/page.tsx:180-189`.
- **Couleurs hardcodées hors design system** dans tout le portail patient — `mood/page.tsx`, `journal/page.tsx`.
- **react-hook-form + zod sous-utilisés** (9 fichiers seulement) — formulaires en useState manuel.

### Dépendances
- **multer@2.0.2 transitif (DoS)** via `@nestjs/platform-express` — coexiste avec 2.1.1 déclaré. → override pnpm.

### DevOps
- **Pas de .dockerignore + `COPY . .`** — `apps/web/Dockerfile:21`. `.env.local`, `.vercel/.env`, `.git` bakés dans l'image.
- **Secrets OIDC Keycloak en dur** (`change-me-in-production`) — `docker/keycloak-prod/realm/psyscale-realm.json:57,90`.
- **docker-compose dev : mots de passe triviaux + ports 0.0.0.0 + start-dev** — `docker-compose.yml`.
- **Aucun scan sécurité CI** (audit/SAST/secrets/image) — `.github/workflows/ci.yml`.
- **Intégration/mobile non bloquants, web non testé** — `ci.yml:85`.
- **SPOF total : API+PG+Redis+Keycloak sur un VPS OVH**, RPO ~24h, pas de failover.

### Tests
- **Résumé IA (consentement → LLM) sans aucun test** — `ai.service.spec.ts`.
- **Modules sensibles sans tests** : messaging chiffré, documents/S3, guardians, accounting/FEC, calendar-sync.
- **E2E : auth contournée, toutes API mockées** — `apps/web/e2e/helpers.ts`.
- **Webhook Stripe : logique métier (worker) non testée** — `webhook.controller.spec.ts`.
- **RolesGuard & SubscriptionGuard réels non testés** — `auth/guards/`.

---

## 🔵 FAIBLE & ⚪ INFO (sélection)

- Refresh token Keycloak stocké dans le JWT next-auth (low).
- `/auth/revoke` décode le JWT sans vérifier la signature (low, mitigé par le guard).
- Controller messaging autorise rôle `patient` via KeycloakGuard alors que les patients sont en HS256 (low, probable dysfonctionnement).
- GuardianPortalService ne re-vérifie pas le lien tuteur↔patient (low, mitigé par le guard).
- Endpoint préférences notif sans DTO (low).
- Export FEC : champs `counterpart`/`pieceRef` non échappés du pipe (low).
- `findMany` non bornés sur exports/import dedup (low).
- N+1 d'écritures dans la synchro Google Calendar (low).
- `Session.summaryAi` chiffrement conditionnel ambigu (low).
- Header `X-XSS-Protection` déprécié, `img-src https:` trop large (low).
- Dépendances mortes `bull@4`+`@nestjs/bull` (low), drift zod v3/v4 (low).
- Déploiement SSH `StrictHostKeyChecking=no` (low), `GITHUB_TOKEN` non restreint (low).
- n8n cohabite avec le périmètre HDS sur le même VPS (info).
- Pas d'index `audit_logs.created_at` seul pour la rétention (info).
- Clés React par index sur tags éditables (info).

---

## Quick wins (fort impact / faible effort)

1. Sortir `redirect()` des try/catch (H5) — répare le funnel d'activation. **1 ligne.**
2. Inverser l'ordre dans le webhook Stripe (H1) — enqueue avant de marquer traité.
3. Déchiffrer la note d'humeur (psy + export RGPD) — `patients.service.ts:353,672`. **1 ligne ×2.**
4. Ajouter `logDecrypt` sur résumé IA + exports (H2/H3).
5. Créer un `.dockerignore` racine — stoppe la fuite de secrets dans l'image.
6. Échapper `</script>` dans le JSON-LD profil psy (`safeJsonLd()`).
7. Échapper le pipe dans tous les champs FEC.
8. Magic-bytes sur l'upload de justificatifs (`detectMimeFromMagicBytes`).
9. `pnpm audit` + secret-scanning + CodeQL/Dependabot en CI.
10. `defaultJobOptions` sur la queue billing.

---

## Plan d'action recommandé

**Sprint 0 — Bloquant conformité (avant tout nouveau client)**
- C1 Scribe consentement backend
- H2/H3 audit DECRYPT (IA + exports)
- H1 webhook Stripe
- Quick wins #1, #3, #5

**Sprint 1 — Fiabilité métier**
- H6 double-booking, factures >999, crons verrou distribué, queue billing
- H5 gating onboarding (si pas fait en quick win), MoodSelector

**Sprint 2 — Durcissement sécurité**
- Guard auth global + `@Public()`, audience JWT, CSP nonces, BFF tokens
- .dockerignore, secrets OIDC externalisés, scans CI

**Sprint 3 — Filet de tests + dette**
- H4 tests intégration réels, tests modules sensibles, RolesGuard/SubscriptionGuard
- A11y WCAG (focus, dialog, cibles 44px), design system portail patient

> _Méthode : 12 dimensions auditées en parallèle, chaque finding critique/élevé soumis à un agent sceptique chargé de le réfuter en relisant le code. 82/82 confirmés, plusieurs sévérités rétrogradées (ex. xlsx, MoodSelector, .dockerignore : high→medium)._
