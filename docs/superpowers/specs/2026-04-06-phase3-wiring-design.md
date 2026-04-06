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
  ☐ J'autorise le traitement anonymisé de mes données par intelligence artificielle
    pour personnaliser mes exercices thérapeutiques. (Optionnel)
  ```
- Ajouter `consentAi: boolean` au schema Zod (défaut `false`)
- Envoyer `consentAi` dans le body du `POST /patient-portal/auth/accept-invitation`

**Backend** (`apps/api/src/patient-portal/patient-auth.service.ts`) :
- Ajouter `consentAi?: boolean` au `AcceptInvitationDto`
- Modifier la transaction `acceptInvitation()` : ne créer `gdpr_consents` type `ai_processing` **que si** `dto.consentAi === true`
- Les 2 autres consentements (`portal_access`, `data_processing`) restent auto-accordés (nécessaires au fonctionnement du portail)

**PatientPortalSection** (`apps/web/src/components/patients/patient-portal-section.tsx`) :
- Afficher le statut consentement IA dans la section header : badge "IA autorisée" (vert) ou "IA non autorisée" (gris)
- Le statut vient de `patientsApi.portalStatus()` — ajouter `hasAiConsent: boolean` à la réponse `getInvitationStatus()` dans `patient-invitation.service.ts`

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `apps/web/src/app/patient/accept-invitation/page.tsx` | Checkbox consentAi + Zod schema + body |
| `apps/api/src/patient-portal/dto/patient-auth.dto.ts` | `consentAi?: boolean` dans AcceptInvitationDto |
| `apps/api/src/patient-portal/patient-auth.service.ts` | Conditionner `ai_processing` consent |
| `apps/api/src/patient-portal/patient-invitation.service.ts` | `hasAiConsent` dans getInvitationStatus() |
| `apps/web/src/components/patients/patient-portal-section.tsx` | Badge statut consentement IA |

---

## Chantier 2 : Exercices IA — Génération + Assignation côté psy

### Contexte existant

- **`POST /ai/generate-exercise`** existe et retourne un JSON `{ title, description, instructions, duration, frequency, disclaimer }` — mais ne sauve rien en DB
- **`GET /patients/:id/portal-exercises`** existe (lecture côté psy)
- **Table `exercises`** existe : `id, patientId, title, description, status, createdByAi, dueDate, completedAt, patientFeedback`
- **Pas d'endpoint de création d'exercice** côté psy

### Solution

**Backend — Nouvel endpoint** :

`POST /patients/:id/exercises` dans `PatientsController` :
```typescript
{
  title: string;           // requis
  description: string;     // requis
  dueDate?: string;        // ISO date, optionnel
  createdByAi: boolean;    // true si généré par IA
}
```
- Vérifie que le patient appartient au psy (tenant isolation)
- Crée la ligne `exercises` avec `status: 'assigned'`
- Audit log `CREATE` sur `exercise`
- Retourne l'exercice créé

**Frontend — Nouveau composant** :

`apps/web/src/components/patients/exercise-dialog.tsx` — Dialog avec 2 onglets :

**Onglet "Manuel"** :
- Champs : titre (requis), description (textarea, requis), date limite (date picker, optionnel)
- Bouton "Assigner"

**Onglet "IA"** :
- Champs : thème (requis), type d'exercice (select: breathing/journaling/exposure/mindfulness/cognitive), contexte patient (textarea, optionnel)
- Bouton "Générer" → appelle `POST /ai/generate-exercise`
- Affiche le résultat en preview (titre + description + instructions)
- Le psy peut éditer titre/description avant de sauvegarder
- Bouton "Assigner" → appelle `POST /patients/:id/exercises` avec `createdByAi: true`
- Si pas de consentement IA patient → message d'avertissement : "Ce patient n'a pas autorisé le traitement IA. L'exercice sera créé sans personnalisation IA."

**Intégration dans PatientPortalSection** :
- Bouton "Nouvel exercice" (icône +) à côté du titre "Exercices"
- Ouvre le `ExerciseDialog`
- Après assignation : rafraîchit la liste exercices

### Fichiers modifiés/créés

| Fichier | Action |
|---------|--------|
| `apps/api/src/patients/patients.controller.ts` | Ajouter `POST /:id/exercises` |
| `apps/api/src/patients/patients.service.ts` | Ajouter `createExercise()` |
| `apps/api/src/patients/dto/patient.dto.ts` | Ajouter `CreateExerciseDto` |
| `apps/web/src/components/patients/exercise-dialog.tsx` | **NOUVEAU** — dialog 2 onglets |
| `apps/web/src/components/patients/patient-portal-section.tsx` | Bouton "Nouvel exercice" + refresh |
| `apps/web/src/lib/api/patients.ts` | Ajouter `createExercise()` |
| `apps/web/src/lib/api/ai.ts` | Ajouter `generateExercise()` (appel non-streaming) |

---

## Chantier 3 : Nettoyage API client + assessments dashboard

### 3a. Uniformiser le client `patient-portal.ts`

Ajouter les méthodes manquantes dans `apps/web/src/lib/api/patient-portal.ts` :
```typescript
getProfile: (token) => fetchPortal<PatientProfile>('/me', token),
getAssessments: (token) => fetchPortal<Assessment[]>('/assessments', token),
submitAssessment: (token, id, answers) => fetchPortal<AssessmentResult>(
  `/assessments/${id}/submit`, token, { method: 'POST', body: JSON.stringify({ answers }) }
),
```

Ajouter les types `Assessment`, `AssessmentResult`, `PatientProfile` au fichier.

### 3b. Migrer `patient-assessments.tsx` vers le client API

Remplacer les appels `fetch` bruts dans `apps/web/src/components/outcomes/patient-assessments.tsx` par les méthodes `patientPortalApi.getAssessments()` et `patientPortalApi.submitAssessment()`.

### 3c. Teaser assessments sur le dashboard patient

**Backend** (`patient-portal.service.ts` → `getDashboard()`) :
- Ajouter `pendingAssessmentsCount: number` au retour — count des assessments `status: 'pending'` pour ce patient

**Frontend** (`apps/web/src/app/(patient-portal)/patient-portal/page.tsx`) :
- Ajouter `pendingAssessmentsCount` au type `PatientDashboard`
- Afficher un teaser card "Évaluations en attente" (lien vers `/patient-portal/assessments`) si count > 0

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `apps/web/src/lib/api/patient-portal.ts` | 3 méthodes + 3 types |
| `apps/web/src/components/outcomes/patient-assessments.tsx` | Remplacer fetch bruts par client API |
| `apps/api/src/patient-portal/patient-portal.service.ts` | `pendingAssessmentsCount` dans getDashboard() |
| `apps/web/src/app/(patient-portal)/patient-portal/page.tsx` | Teaser card assessments |
| `apps/web/src/lib/api/patient-portal.ts` | Type `PatientDashboard` mis à jour |

---

## Résumé des changements

| # | Chantier | Fichiers créés | Fichiers modifiés | Tests |
|---|----------|----------------|-------------------|-------|
| 1 | Consentement IA | 0 | 5 | Modifier test acceptInvitation existant |
| 2 | Exercices IA | 1 (exercise-dialog.tsx) | 6 | Nouveau test createExercise |
| 3 | Cleanup API | 0 | 4 | Modifier test getDashboard existant |

**Total : 1 fichier créé, 13 fichiers modifiés** (certains apparaissent dans plusieurs chantiers mais ne sont comptés qu'une fois).

## Hors scope

- Stripe checkout / webhooks / portail client
- Facturation PDF (déjà fonctionnel)
- Feature flags par plan (déjà fonctionnel)
- Exercice "instructions" step-by-step côté patient (la page exercices patient existe déjà et affiche titre + description)
- Gestion consentement IA dans les paramètres patient (future — on reste sur le consentement à l'invitation pour le MVP)

## Dépendances

- Aucune nouvelle dépendance npm
- Aucune migration Prisma (la table `exercises` existe déjà)
- Le chantier 1 et 2 sont indépendants (parallélisables)
- Le chantier 3 est indépendant des deux autres

## Ordre d'implémentation recommandé

1. Chantier 1 (consentement IA) — petit, débloque le flag `hasAiConsent` pour chantier 2
2. Chantier 2 (exercices IA) — moyen, dépend de `hasAiConsent` pour l'avertissement UI
3. Chantier 3 (cleanup) — petit, indépendant
