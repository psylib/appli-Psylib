# Assistant / Secretary Collaborator Role — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un·e psychologue d'inviter un·e assistant·e (secrétaire / gestion administrative) disposant d'un compte nominatif propre, avec un accès **administratif** (agenda, RDV, fiches patients hors clinique) mais **jamais** au contenu clinique chiffré (notes de séance, résumés IA, journal, messagerie).

**Architecture :** L'assistant·e est un nouveau rôle Keycloak/DB rattaché à UN psychologue via un modèle `Assistant`. Le pivot de sécurité : on **dissocie** l'identité *tenant* (le psychologue rattaché — pour scoper les données) de l'identité *acteur* (l'assistant — pour la traçabilité audit HDS nominative). La stratégie JWT résout `user.psychologistUserId` à la connexion. Approche **deny-by-default** : l'assistant n'atteint QUE les endpoints explicitement ouverts (`@Roles('psychologist','admin','assistant')`), jamais le clinique. Inclus dans tous les plans payants (Solo/Pro/Clinic), gaté par une nouvelle limite `assistants`.

**Tech Stack :** NestJS, Prisma/PostgreSQL, Keycloak Admin API (réutilise le flux d'auto-registration existant), Next.js App Router + NextAuth, shared-types.

---

## Décisions verrouillées (issues du cadrage)

1. **Périmètre assistant = administratif uniquement.**
   - ✅ Voit/gère : agenda & RDV (CRUD appointments), liste patients, fiche patient **champs admin** (nom, email, téléphone, date de naissance, statut, source, historique RDV), facturation/paiements (lecture), disponibilités.
   - ❌ N'accède JAMAIS (ni déchiffrement, ni lecture) : `Session.notes`, `Session.summaryAi`, `Session.scribeTranscript`, `Patient.notes`, `JournalEntry.content`, `Message.content`, IA, mood/journal portail.
2. **Tenant ≠ Acteur.** Tenant = psychologue rattaché (`user.psychologistUserId`). Acteur audit = l'assistant (`user.sub`).
3. **Packaging :** limite `assistants` — Free `0`, Solo `1`, Pro `3`, Clinic `-1` (illimité).
4. **1 assistant ↔ 1 psychologue** en v1 (le modèle `Assistant` permettra plus tard du many-to-many sans refonte).

## File Structure

**Backend (apps/api)**
- `prisma/schema.prisma` — +modèle `Assistant`, +modèle `AssistantInvitation`, +enum `AssistantInvitationStatus`, +`ASSISTANT` dans relations User/Psychologist.
- `prisma/migrations/<ts>_assistant_role/migration.sql` — migration idempotente (`IF NOT EXISTS`).
- `src/auth/keycloak-jwt.strategy.ts` — `extractPrimaryRole()` gère `assistant` ; `validate()` résout `user.psychologistUserId`.
- `src/auth/decorators/tenant-psychologist.decorator.ts` — **nouveau** param decorator `@TenantPsychologistUserId()`.
- `src/assistants/assistants.module.ts` — **nouveau** module.
- `src/assistants/assistants.service.ts` — **nouveau** : invite/list/revoke + provisioning Keycloak.
- `src/assistants/assistants.controller.ts` — **nouveau** : endpoints psy (invite/list/revoke) + accept public.
- `src/assistants/dto/assistant.dto.ts` — **nouveau** DTOs.
- `src/notifications/emails/assistant-invitation.ts` — **nouveau** template email.
- `src/patients/patients.controller.ts` — ouvre lecture admin à `assistant` (méthodes ciblées) + tenant/actor dissociés.
- `src/patients/patients.service.ts` — `findOneAdmin()` (sans déchiffrement notes).
- `src/appointments/appointments.controller.ts` — ouvre CRUD à `assistant`, tenant/actor dissociés.
- `src/auth/auth.service.ts` — réutilise `getAdminToken`/`createKeycloakUser`/`assignKeycloakRole`.

**Shared (packages/shared-types)**
- `src/index.ts` — `UserRole.ASSISTANT`, `assistants` dans `PLAN_LIMITS`, types `Assistant`/`AssistantInvitation`.

**Frontend (apps/web)**
- `src/lib/auth/auth.config.ts` — `extractRole()` gère `assistant` (login via Keycloak provider, comme psychologist).
- `src/app/(dashboard)/layout.tsx` — autorise `assistant` (pas de redirect portail).
- `src/components/layouts/sidebar.tsx` — masque routes cliniques/facturation si `role === 'assistant'`.
- `src/app/(dashboard)/dashboard/settings/team/page.tsx` — **nouvelle** page « Mon équipe » (inviter/lister/révoquer assistant).
- `src/app/(auth)/assistant-invite/[token]/page.tsx` — **nouvelle** page d'acceptation.
- `src/lib/api/assistants.ts` — **nouveau** client API.

---

## Task 1 : Rôle ASSISTANT dans shared-types

**Files:**
- Modify: `packages/shared-types/src/index.ts` (enum `UserRole` ~lignes 10-15 ; `PLAN_LIMITS` ~507-512)

- [ ] **Step 1 — Ajouter le rôle et la limite**

Dans `enum UserRole`, ajouter :
```ts
  ASSISTANT = 'assistant',
```

Étendre le type et chaque entrée de `PLAN_LIMITS` avec `assistants` :
```ts
export const PLAN_LIMITS: Record<SubscriptionPlan, { patients: number | null; sessions: number | null; aiSummaries: number; videoConsultations: number | null; courses: number | null; expenses: number | null; documentsBytesMonthly: number | null; calendarSync: boolean; accounting: boolean; assistants: number }> = {
  [SubscriptionPlan.FREE]:   { /* …existant… */ assistants: 0 },
  [SubscriptionPlan.SOLO]:   { /* …existant… */ assistants: 1 },
  [SubscriptionPlan.PRO]:    { /* …existant… */ assistants: 3 },
  [SubscriptionPlan.CLINIC]: { /* …existant… */ assistants: -1 },
};
```
(`-1` = illimité, cohérent avec la convention existante.)

- [ ] **Step 2 — Types partagés** : ajouter en fin de section types
```ts
export interface AssistantSummary {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'active' | 'revoked';
  createdAt: string;
}
```

- [ ] **Step 3 — Build** : `pnpm --filter @psyscale/shared-types build` → succès, `dist/index.js` régénéré.

- [ ] **Step 4 — Commit** : `git commit -m "feat(types): add ASSISTANT role + assistants plan limit"`

---

## Task 2 : Schéma Prisma — modèles Assistant & AssistantInvitation

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<ts>_assistant_role/migration.sql`

- [ ] **Step 1 — Ajouter les modèles** (mirroir de `LegalGuardian`/`GuardianInvitation`) :
```prisma
enum AssistantInvitationStatus {
  pending
  accepted
  expired
}

model Assistant {
  id             String   @id @default(uuid())
  userId         String?  @map("user_id")
  psychologistId String   @map("psychologist_id")
  name           String
  email          String
  status         String   @default("pending") // pending | active | revoked
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user         User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  psychologist Psychologist @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  invitations  AssistantInvitation[]

  @@unique([psychologistId, email])
  @@index([userId], name: "idx_assistants_user")
  @@index([psychologistId], name: "idx_assistants_psy")
  @@map("assistants")
}

model AssistantInvitation {
  id             String                    @id @default(uuid())
  psychologistId String                    @map("psychologist_id")
  assistantId    String                    @map("assistant_id")
  email          String
  token          String                    @unique
  status         AssistantInvitationStatus @default(pending)
  expiresAt      DateTime                  @map("expires_at")
  createdAt      DateTime                  @default(now()) @map("created_at")

  psychologist Psychologist @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  assistant    Assistant    @relation(fields: [assistantId], references: [id], onDelete: Cascade)

  @@index([token], name: "idx_assistant_invitations_token")
  @@index([assistantId], name: "idx_assistant_invitations_assistant")
  @@index([psychologistId], name: "idx_assistant_invitations_psy")
  @@map("assistant_invitations")
}
```
Ajouter les relations inverses : dans `model User { … assistantAccounts Assistant[] }` et `model Psychologist { … assistants Assistant[]  assistantInvitations AssistantInvitation[] }`.

- [ ] **Step 2 — Générer la migration** :
`cd apps/api && npx prisma migrate dev --name assistant_role --create-only`
Puis **rendre la migration idempotente** (prod) : envelopper les `CREATE TABLE`/`CREATE TYPE`/`CREATE INDEX` en `IF NOT EXISTS` (le type enum via bloc `DO $$ … EXCEPTION WHEN duplicate_object`).

- [ ] **Step 3 — Appliquer local + générer client** : `npx prisma migrate deploy && npx prisma generate` → succès.

- [ ] **Step 4 — Commit** : `git commit -m "feat(db): assistant + assistant_invitation models"`

---

## Task 3 : Résolution tenant (JWT strategy) + decorator

**Files:**
- Modify: `apps/api/src/auth/keycloak-jwt.strategy.ts`
- Create: `apps/api/src/auth/decorators/tenant-psychologist.decorator.ts`
- Test: `apps/api/src/auth/keycloak-jwt.strategy.spec.ts`

- [ ] **Step 1 — Test (échec attendu)** : ajouter un test vérifiant que `validate()` d'un token rôle `assistant` retourne `psychologistUserId` = le `userId` du psychologue rattaché via `Assistant`.
```ts
it('resolves psychologistUserId for an assistant token', async () => {
  // mock prisma.assistant.findFirst → { psychologist: { userId: 'psy-user-1' }, status: 'active' }
  const result = await strategy.validate(mkPayload({ roles: ['assistant'], sub: 'assistant-user-1' }));
  expect(result.role).toBe('assistant');
  expect(result.psychologistUserId).toBe('psy-user-1');
});
```
Run: `pnpm --filter @psyscale/api test keycloak-jwt.strategy` → FAIL.

- [ ] **Step 2 — Implémentation `extractPrimaryRole`** : insérer `assistant` dans la priorité, **avant** `patient`, après `psychologist` :
`admin > psychologist > assistant > patient`.

- [ ] **Step 3 — Implémentation `validate()`** : après extraction du rôle, calculer `psychologistUserId` :
```ts
let psychologistUserId = user.sub; // par défaut le psy lui-même
if (role === 'assistant') {
  const link = await this.prisma.assistant.findFirst({
    where: { userId: user.sub, status: 'active' },
    include: { psychologist: { select: { userId: true } } },
  });
  if (!link) throw new UnauthorizedException('Compte assistant non rattaché ou révoqué');
  psychologistUserId = link.psychologist.userId;
}
return { ...user, role, psychologistUserId };
```
Mettre à jour l'interface `KeycloakUser` : `psychologistUserId: string`.
**⚠️ Sécurité** : un assistant `status !== 'active'` (révoqué/pending) → `UnauthorizedException`. La résolution se fait à CHAQUE requête (révocation immédiate effective).

- [ ] **Step 4 — Param decorator** :
```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const TenantPsychologistUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    return req.user.psychologistUserId; // psy rattaché si assistant, sinon soi-même
  },
);
```

- [ ] **Step 5 — Tests verts** : `pnpm --filter @psyscale/api test keycloak-jwt.strategy` → PASS.

- [ ] **Step 6 — Commit** : `git commit -m "feat(auth): resolve tenant psychologistUserId for assistant role"`

---

## Task 4 : Service & provisioning assistant (Keycloak)

**Files:**
- Create: `apps/api/src/assistants/assistants.service.ts`, `assistants.module.ts`, `dto/assistant.dto.ts`
- Create: `apps/api/src/notifications/emails/assistant-invitation.ts`
- Modify: `apps/api/src/app.module.ts` (importer `AssistantsModule`)
- Test: `apps/api/src/assistants/assistants.service.spec.ts`

- [ ] **Step 1 — DTO** :
```ts
import { IsEmail, IsString, MinLength } from 'class-validator';
export class InviteAssistantDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
}
```

- [ ] **Step 2 — Test (échec)** : `inviteAssistant` refuse si la limite `assistants` du plan est atteinte (`ForbiddenException`), et crée sinon un `Assistant`(pending)+`AssistantInvitation`(token 32o, +7j). Mock prisma + subscription.

- [ ] **Step 3 — Implémentation service** (méthodes) :
  - `inviteAssistant(psyUserId, dto)` :
    1. Résoudre `psychologist` via `userId`.
    2. Compter `assistant.count({ where: { psychologistId, status: { in: ['pending','active'] } } })` ; comparer à `PLAN_LIMITS[plan].assistants` (`-1` = illimité ; `0` → Forbidden « non disponible sur votre plan »).
    3. `crypto.randomBytes(32).toString('hex')` token, `expiresAt = +7j`.
    4. `prisma.assistant.create` (status `pending`) puis `assistant_invitation.create`.
    5. Envoyer email via Resend (template Step 5) → lien `{FRONTEND_URL}/assistant-invite/{token}`.
    6. `audit.log({ actorId: psyUserId, action: 'CREATE', entityType: 'assistant', entityId })`.
  - `listAssistants(psyUserId)` → `AssistantSummary[]`.
  - `revokeAssistant(psyUserId, assistantId)` : `status='revoked'`, et si `userId` présent → désactiver le user Keycloak (`PUT /admin/realms/{realm}/users/{kcId}` `{ enabled: false }`) via `auth.service`. Audit.
  - `acceptInvitation(token, password)` :
    1. Valider token (existe, `pending`, non expiré → sinon passer `expired`).
    2. Créer le user Keycloak (réutiliser `authService.createKeycloakUser`) + `assignKeycloakRole('assistant')` + définir le mot de passe (set credentials).
    3. Créer `User`(role `assistant`) en DB, lier `Assistant.userId`, `status='active'`, invitation `accepted`.
    4. Audit `actorType:'assistant'`.

- [ ] **Step 4 — Module** : `AssistantsModule` providers `[AssistantsService]`, imports `[AuthModule, CommonModule, NotificationsModule]`, exporte le service ; importer dans `app.module.ts`.

- [ ] **Step 5 — Email template** `assistant-invitation.ts` : mirroir de `guardian-invitation.ts`, sujet « {psyName} vous invite comme assistant·e sur PsyLib », CTA vers le lien d'acceptation, mention RGPD/secret pro.

- [ ] **Step 6 — Tests verts** + **Step 7 — Commit** `feat(assistants): invitation service + Keycloak provisioning`.

---

## Task 5 : Controller assistants (psy + acceptation publique)

**Files:**
- Create: `apps/api/src/assistants/assistants.controller.ts`

- [ ] **Step 1 — Endpoints psy** (`@UseGuards(KeycloakGuard, RolesGuard)`, `@Roles('psychologist','admin')`) :
  - `POST /assistants` → `inviteAssistant(user.sub, dto)`
  - `GET /assistants` → `listAssistants(user.sub)`
  - `DELETE /assistants/:id` → `revokeAssistant(user.sub, id)`
- [ ] **Step 2 — Endpoints publics** (token, pas de guard) :
  - `GET /assistants/invitations/:token` → `validateToken`
  - `POST /assistants/invitations/:token/accept` `{ password }` → `acceptInvitation`
- [ ] **Step 3 — Smoke test e2e** (Supertest) : invite (mock) → 201. **Step 4 — Commit.**

---

## Task 6 : Ouvrir les endpoints admin à l'assistant (deny-by-default)

**Files:**
- Modify: `apps/api/src/patients/patients.controller.ts`, `apps/api/src/patients/patients.service.ts`
- Modify: `apps/api/src/appointments/appointments.controller.ts` (+ service si tenant arg)
- Test: `apps/api/src/patients/patients.assistant.e2e-spec.ts`

> **Règle d'or de cette tâche :** pour CHAQUE endpoint ouvert à `assistant`, remplacer l'argument *tenant* `user.sub` par `@TenantPsychologistUserId()`, et **conserver** `user.sub` comme *actorId* (audit). Ne JAMAIS ouvrir un endpoint qui déchiffre du clinique.

- [ ] **Step 1 — Test (échec)** : un token assistant qui `GET /patients` voit les patients du psy rattaché ; `GET /patients/:id` ne renvoie **pas** `notes` ; l'audit log porte `actorId = assistantUserId`.

- [ ] **Step 2 — Patients** :
  - `@Roles('psychologist','admin','assistant')` sur le controller, MAIS retirer l'accès assistant aux méthodes cliniques en les annotant `@Roles('psychologist','admin')` au niveau méthode : `findOne` (déchiffre notes) reste psy-only ; exposer une route admin `GET /patients/:id/admin` → `patientsService.findOneAdmin()` (sélection sans `notes`, pas de `decrypt`, audit READ).
  - Ouvrir à l'assistant : `findAll`, `getStats`, `findOneAdmin`, `create` (champs admin), `update` (champs admin — interdire `notes` dans le DTO pour assistant : si `role==='assistant'` et `dto.notes` défini → `ForbiddenException`).
  - Remplacer le 1er arg (`user.sub`) par `@TenantPsychologistUserId() psyUserId` sur les méthodes ouvertes ; garder `user.sub` en `actorId`.
  - `findOneAdmin(psyUserId, patientId, actorId, req)` : copie de `findOne` **sans** le bloc `decrypt(notes)` + `select` excluant `notes`.

- [ ] **Step 3 — Appointments / agenda** : `@Roles(...,'assistant')` sur CRUD RDV + disponibilités ; tenant = `@TenantPsychologistUserId()`, actor = `user.sub`. (Les RDV ne contiennent pas de champ chiffré → OK.)

- [ ] **Step 4 — Vérif négative** : confirmer que `sessions.controller`, `ai.*`, `journal`, `messaging`, `mood`, `billing` **n'ont PAS** `assistant` dans `@Roles` (restent fermés). Test e2e : token assistant sur `GET /sessions/:id` → 403.

- [ ] **Step 5 — Tests verts** + **Step 6 — Commit** `feat(assistants): grant admin-scoped access to patients & agenda`.

---

## Task 7 : Frontend — login, layout, sidebar

**Files:**
- Modify: `apps/web/src/lib/auth/auth.config.ts`, `src/app/(dashboard)/layout.tsx`, `src/components/layouts/sidebar.tsx`

- [ ] **Step 1 — Rôle** : dans `extractRole()`, mapper `assistant` (présent dans `realm_access.roles`) → `'assistant'`. L'assistant se connecte via le **même provider Keycloak** que le psy.
- [ ] **Step 2 — Layout** `(dashboard)/layout.tsx` : autoriser `assistant` (ne PAS rediriger vers le portail patient ; seul `patient` est redirigé). Skipper le check onboarding pour `assistant`.
- [ ] **Step 3 — Sidebar** : si `role === 'assistant'`, filtrer `NAV_GROUPS` pour ne garder que **Agenda, Patients, (Disponibilités)** ; masquer Notes/Séances, IA, Facturation, Comptabilité, Formations, Paramètres sensibles. Afficher un badge « Assistant·e » sous le nom.
- [ ] **Step 4 — Commit** `feat(web): assistant role nav gating + dashboard access`.

---

## Task 8 : Frontend — page « Mon équipe » + page d'acceptation

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/settings/team/page.tsx`
- Create: `apps/web/src/app/(auth)/assistant-invite/[token]/page.tsx`
- Create: `apps/web/src/lib/api/assistants.ts`

- [ ] **Step 1 — Client API** : `inviteAssistant`, `listAssistants`, `revokeAssistant`, `validateAssistantInvite`, `acceptAssistantInvite` (mirroir des clients guardian).
- [ ] **Step 2 — Page équipe** (psy) : liste des assistants (badge statut), formulaire invitation (nom + email), bouton révoquer (confirm-dialog). Empty state `<EmptyState>`. Si la limite plan est atteinte ou plan Free → message d'upsell. Lien dans Paramètres.
- [ ] **Step 3 — Page acceptation** (`/assistant-invite/[token]`) : valide le token, affiche nom du psy, formulaire mot de passe, POST accept → redirige vers `/login`. `noindex`.
- [ ] **Step 4 — Commit** `feat(web): team management + assistant invite acceptance pages`.

---

## Task 9 : Keycloak realm + déploiement

- [ ] **Step 1 — Réle Keycloak** : créer le rôle realm `assistant` dans le realm `psyscale` (via Playwright admin console — cf. mémoire, l'admin env var est cassé). Vérifier que le client `psyscale-admin` peut l'assigner.
- [ ] **Step 2 — Build & tests complets** : `pnpm --filter @psyscale/api test` + `pnpm --filter @psyscale/web build` verts.
- [ ] **Step 3 — Déploiement VPS** (procédure mémoire) : tar (exclusions habituelles) → scp → build image `psyscale-api:latest` → `docker compose up -d api` → `npx prisma migrate deploy` → restart.
- [ ] **Step 4 — Déploiement web** : `npx vercel --prod --yes` depuis la racine.
- [ ] **Step 5 — Smoke test prod** : inviter un assistant de test, accepter, vérifier accès agenda + 403 sur `/sessions/:id`, vérifier audit log nominatif.
- [ ] **Step 6 — Commit final + mémoire** : créer `memory/assistant-collaborator-role.md`, ajouter la ligne d'index dans `MEMORY.md`.

---

## Self-Review

- **Couverture spec :** rôle (T1,T3,T7) ✅ ; DB (T2) ✅ ; provisioning Keycloak (T4) ✅ ; invitation/acceptation (T4,T5,T8) ✅ ; accès admin sans clinique (T6) ✅ ; plan gating (T1,T4) ✅ ; audit nominatif (T3,T6) ✅ ; UI psy + assistant (T7,T8) ✅ ; déploiement (T9) ✅.
- **Sécurité HDS — points de contrôle :** (a) résolution tenant à chaque requête avec rejet si non-actif (T3) ; (b) deny-by-default — assistant absent des `@Roles` cliniques, test 403 explicite (T6 Step 4) ; (c) `notes`/`summaryAi` jamais déchiffrés pour assistant (`findOneAdmin`) ; (d) update assistant interdit sur `notes` ; (e) audit `actorId = assistant` (traçabilité nominative).
- **Cohérence types :** `psychologistUserId` (KeycloakUser), `@TenantPsychologistUserId()`, `findOneAdmin`, limite `assistants` — noms identiques d'un bout à l'autre.
- **Risque connu :** les nombreux endpoints utilisant `user.sub` comme tenant ne sont PAS modifiés (volontaire) — l'assistant n'y accède pas (deny-by-default). Seuls patients (admin) + appointments sont ouverts et dissociés.
