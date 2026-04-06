# Phase 3 — Câblage Complet (sans Stripe)

## Objectif

Rendre fonctionnels les sous-systèmes Phase 3 déjà codés côté backend : consentement IA explicite, exercices IA (génération + assignation côté psy), et nettoyage API client patient portal.

## Périmètre

3 chantiers indépendants. Pas de Stripe, pas de paiement en ligne.

---

## Chantier 1 : Consentement IA explicite à l'invitation

### Problème

Le `acceptInvitation()` backend (`patient-auth.service.ts:78-97`) auto-crée 3 `gdpr_consents` dont `ai_processing`. RGPD exige un consentement IA **explicite et opt-in**, pas auto-accordé.

### Solution

**Frontend** (`apps/web/src/app/patient/accept-invitation/page.tsx`) :
- Ajouter une checkbox sous le formulaire mot de passe :
  ```
  ☐ J'autorise le traitement de mes données par intelligence artificielle
    pour personnaliser mes exercices thérapeutiques. (Optionnel)
  ```
- Ajouter `consentAi: z.boolean().default(false)` au schema Zod
- Envoyer `consentAi` dans le body du `POST /patient-portal/auth/accept-invitation`

**Backend** (`apps/api/src/patient-portal/patient-auth.service.ts`) :
- Ajouter `consentAi?: boolean` au `AcceptInvitationDto` avec décorateurs `@IsBoolean()` et `@IsOptional()`
- Modifier la transaction `acceptInvitation()` : ne créer `gdpr_consents` type `ai_processing` **que si** `dto.consentAi === true`
- Les 2 autres consentements (`portal_access`, `data_processing`) restent auto-accordés (nécessaires au fonctionnement du portail)

**Backend** (`apps/api/src/patient-portal/patient-invitation.service.ts`) :
- Dans `getInvitationStatus()` : ajouter une query `prisma.gdprConsent.findFirst({ where: { patientId, type: 'ai_processing', withdrawnAt: null } })` pour déterminer `hasAiConsent: boolean`
- Ajouter `hasAiConsent` au retour de `getInvitationStatus()`

**Frontend** (`apps/web/src/components/patients/patient-portal-section.tsx`) :
- Ajouter `hasAiConsent?: boolean` à l'interface locale `PortalStatus` (ligne 7-11)
- Afficher le statut consentement IA dans la section header : badge "IA autorisée" (vert) ou "IA non autorisée" (gris)

**Frontend** (`apps/web/src/lib/api/patients.ts`) :
- Mettre à jour le type retour de `portalStatus()` pour inclure `hasAiConsent`

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `apps/web/src/app/patient/accept-invitation/page.tsx` | Checkbox consentAi + Zod schema + body |
| `apps/api/src/patient-portal/dto/patient-auth.dto.ts` | `@IsBoolean() @IsOptional() consentAi?: boolean` |
| `apps/api/src/patient-portal/patient-auth.service.ts` | Conditionner `ai_processing` consent sur `dto.consentAi === true` |
| `apps/api/src/patient-portal/patient-invitation.service.ts` | Query gdpr_consents + `hasAiConsent` dans retour |
| `apps/web/src/components/patients/patient-portal-section.tsx` | Badge statut consentement IA + type PortalStatus |
| `apps/web/src/lib/api/patients.ts` | Type retour portalStatus() mis à jour |

---

## Chantier 2 : Exercices IA — Génération + Assignation côté psy

### Contexte existant

- **`POST /ai/generate-exercise`** existe et retourne un JSON `{ title, description, instructions, duration, frequency, disclaimer }` — mais ne sauve rien en DB. **Si `patientId` est fourni, vérifie le consentement IA et throw 403 si absent.**
- **`GET /patients/:id/portal-exercises`** existe (lecture côté psy)
- **Table `exercises`** existe : `id, patientId, title, description, status, createdByAi, dueDate, completedAt, patientFeedback`
- **Pas d'endpoint de création d'exercice** côté psy

### Solution

**Backend — Nouvel endpoint** :

`POST /patients/:id/exercises` dans `PatientsController` :
```typescript
class CreateExerciseDto {
  @IsString() @MinLength(3) @MaxLength(200)
  title: string;

  @IsString() @MinLength(10) @MaxLength(5000)
  description: string;

  @IsOptional() @IsDateString()
  dueDate?: string;

  @IsBoolean()
  createdByAi: boolean;
}
```
- Vérifie que le patient appartient au psy (tenant isolation)
- Crée la ligne `exercises` avec `status: 'assigned'`
- Note : le champ `instructions` retourné par l'IA n'est pas stocké en DB (la table n'a pas cette colonne). Le psy intègre les instructions dans `description` lors de l'édition avant assignation. Explicitement hors scope.
- Audit log géré par `AuditInterceptor` déjà actif sur le controller
- Retourne l'exercice créé

**Frontend — Nouveau composant** :

`apps/web/src/components/patients/exercise-dialog.tsx` — Dialog avec 2 onglets :

Props : `{ patientId: string; hasAiConsent: boolean; open: boolean; onClose: () => void; onCreated: () => void }`

**Onglet "Manuel"** :
- Champs : titre (requis), description (textarea, requis), date limite (date picker, optionnel)
- Bouton "Assigner" → `POST /patients/:id/exercises` avec `createdByAi: false`

**Onglet "IA"** :
- Si `hasAiConsent === false` : message d'avertissement "Ce patient n'a pas autorisé le traitement IA. Utilisez l'onglet Manuel pour créer un exercice." + bouton "Générer" désactivé
- Si `hasAiConsent === true` :
  - Champs : thème (requis), type d'exercice (select: breathing/journaling/exposure/mindfulness/cognitive), contexte patient (textarea, requis — correspond à `patientContext` backend qui est `@IsString()` obligatoire)
  - Bouton "Générer" → appelle `POST /ai/generate-exercise` avec `{ patientContext, theme, exerciseType }` (sans `patientId` — la vérification consent est déjà faite côté frontend via `hasAiConsent`)
  - Affiche le résultat en preview (titre + description éditables, instructions en read-only)
  - Bouton "Assigner" → appelle `POST /patients/:id/exercises` avec `{ title, description, createdByAi: true }`
  - Le psy peut intégrer les instructions dans la description avant de sauvegarder

**Intégration dans PatientPortalSection** :
- Bouton "Nouvel exercice" (icône Plus) à côté du titre "Exercices"
- Ouvre le `ExerciseDialog` avec `hasAiConsent` lu depuis `status.hasAiConsent`
- Callback `onCreated` → re-fetch `patientsApi.portalExercises()` pour rafraîchir la liste

### Fichiers modifiés/créés

| Fichier | Action |
|---------|--------|
| `apps/api/src/patients/patients.controller.ts` | Ajouter `POST /:id/exercises` |
| `apps/api/src/patients/patients.service.ts` | Ajouter `createExercise()` |
| `apps/api/src/patients/dto/patient.dto.ts` | Ajouter `CreateExerciseDto` (voir shape ci-dessus) |
| `apps/web/src/components/patients/exercise-dialog.tsx` | **NOUVEAU** — dialog 2 onglets |
| `apps/web/src/components/patients/patient-portal-section.tsx` | Bouton "Nouvel exercice" + `onCreated` refresh |
| `apps/web/src/lib/api/patients.ts` | Ajouter `createExercise(patientId, dto, token)` |
| `apps/web/src/lib/api/ai.ts` | Ajouter `generateExercise(dto, token)` (appel non-streaming, fichier existe déjà) |

---

## Chantier 3 : Nettoyage API client + assessments dashboard

### 3a. Uniformiser le client `patient-portal.ts`

Ajouter les méthodes et types manquants dans `apps/web/src/lib/api/patient-portal.ts`.

**Types à promouvoir** (déjà définis localement dans `patient-assessments.tsx` lignes 9-41) :
```typescript
export interface AssessmentQuestion {
  id: string;
  text: string;
  options: { value: number; label: string }[];
}

export interface PendingAssessment {
  id: string;
  name: string;
  description: string;
  questions: AssessmentQuestion[];
  createdAt: string;
}

export interface CompletedAssessment {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  severity: string;
  completedAt: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  psychologist: { name: string; specialization: string };
}
```

**Méthodes à ajouter** :
```typescript
getProfile: (token) => fetchPortal<PatientProfile>('/me', token),
getAssessments: (token) => fetchPortal<{ pending: PendingAssessment[]; completed: CompletedAssessment[] }>('/assessments', token),
submitAssessment: (token, id, answers) => fetchPortal<{ score: number; maxScore: number; severity: string }>(
  `/assessments/${id}/submit`, token, { method: 'POST', body: JSON.stringify({ answers }) }
),
```

### 3b. Migrer `patient-assessments.tsx` vers le client API

Remplacer les appels `fetch` bruts dans `apps/web/src/components/outcomes/patient-assessments.tsx` par `patientPortalApi.getAssessments()` et `patientPortalApi.submitAssessment()`. Supprimer les types locaux dupliqués et importer depuis `patient-portal.ts`.

### 3c. Teaser assessments sur le dashboard patient

**Backend** (`patient-portal.service.ts` → `getDashboard()`) :
- Ajouter dans le `Promise.all()` existant : `this.prisma.assessment.count({ where: { patientId, status: 'pending' } })`
- Ajouter `pendingAssessmentsCount: number` au retour

**Frontend** (`apps/web/src/app/(patient-portal)/patient-portal/page.tsx`) :
- Ajouter `pendingAssessmentsCount: number` à l'interface `PatientDashboard` dans `patient-portal.ts`
- Afficher un teaser card "Évaluations en attente" (lien vers `/patient-portal/assessments`) si count > 0
- Route `/patient-portal/assessments` existe déjà (`apps/web/src/app/(patient-portal)/patient-portal/assessments/page.tsx`)

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `apps/web/src/lib/api/patient-portal.ts` | 3 méthodes + types (voir shapes ci-dessus) + `pendingAssessmentsCount` dans PatientDashboard |
| `apps/web/src/components/outcomes/patient-assessments.tsx` | Remplacer fetch bruts par client API, supprimer types locaux dupliqués |
| `apps/api/src/patient-portal/patient-portal.service.ts` | `pendingAssessmentsCount` dans getDashboard() via Promise.all |
| `apps/web/src/app/(patient-portal)/patient-portal/page.tsx` | Teaser card assessments |

---

## Résumé des changements

| # | Chantier | Fichiers créés | Fichiers modifiés | Tests |
|---|----------|----------------|-------------------|-------|
| 1 | Consentement IA | 0 | 6 | Modifier test acceptInvitation existant |
| 2 | Exercices IA | 1 (exercise-dialog.tsx) | 6 | Nouveau test createExercise |
| 3 | Cleanup API | 0 | 4 | Modifier test getDashboard existant |

**Total : 1 fichier créé, ~14 fichiers modifiés** (certains apparaissent dans plusieurs chantiers mais ne sont comptés qu'une fois).

## Hors scope

- Stripe checkout / webhooks / portail client
- Facturation PDF (déjà fonctionnel)
- Feature flags par plan (déjà fonctionnel)
- Colonne `instructions` sur table exercises (le psy intègre les instructions dans `description`)
- Gestion consentement IA dans les paramètres patient (future — on reste sur le consentement à l'invitation pour le MVP)

## Dépendances

- Aucune nouvelle dépendance npm
- Aucune migration Prisma (la table `exercises` existe déjà)
- Le chantier 1 et 2 sont liés (2 dépend de `hasAiConsent` de 1)
- Le chantier 3 est indépendant des deux autres

## Ordre d'implémentation recommandé

1. Chantier 1 (consentement IA) — petit, débloque le flag `hasAiConsent` pour chantier 2
2. Chantier 2 (exercices IA) — moyen, dépend de `hasAiConsent` pour l'avertissement UI
3. Chantier 3 (cleanup) — petit, indépendant (parallélisable avec 1 ou 2)
