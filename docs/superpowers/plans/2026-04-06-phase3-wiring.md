# Phase 3 — Câblage Complet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire existing Phase 3 backend code to frontend — AI consent at invitation, exercise generation/assignment for psychologists, and API client cleanup with assessments dashboard teaser.

**Architecture:** 3 independent work streams: (1) RGPD-compliant AI consent opt-in during patient invitation acceptance, (2) exercise creation endpoint + 2-tab dialog for manual/AI exercise assignment, (3) standardize patient-portal API client and add assessments count to dashboard.

**Tech Stack:** NestJS, Prisma, Next.js App Router, React Hook Form, Zod, class-validator, shadcn/ui

---

## File Structure

### Chantier 1 — Consentement IA
| File | Action | Responsibility |
|------|--------|---------------|
| `apps/api/src/patient-portal/dto/patient-auth.dto.ts` | Modify | Add `consentAi` to AcceptInvitationDto |
| `apps/api/src/patient-portal/patient-auth.service.ts` | Modify | Conditional ai_processing consent creation |
| `apps/api/src/patient-portal/patient-invitation.service.ts` | Modify | Add hasAiConsent to getInvitationStatus |
| `apps/web/src/app/patient/accept-invitation/page.tsx` | Modify | Checkbox + schema + body |
| `apps/web/src/lib/api/patients.ts` | Modify | PortalStatus type update |
| `apps/web/src/components/patients/patient-portal-section.tsx` | Modify | AI consent badge |

### Chantier 2 — Exercices IA
| File | Action | Responsibility |
|------|--------|---------------|
| `apps/api/src/patients/dto/create-patient.dto.ts` | Modify | Add CreateExerciseDto |
| `apps/api/src/patients/patients.service.ts` | Modify | Add createExercise() |
| `apps/api/src/patients/patients.controller.ts` | Modify | Add POST /:id/exercises |
| `apps/web/src/lib/api/patients.ts` | Modify | Add createExercise() |
| `apps/web/src/lib/api/ai.ts` | Modify | Add generateExercise() |
| `apps/web/src/components/patients/exercise-dialog.tsx` | Create | 2-tab dialog |
| `apps/web/src/components/patients/patient-portal-section.tsx` | Modify | Button + refresh |

### Chantier 3 — Cleanup API
| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/src/lib/api/patient-portal.ts` | Modify | Types + methods |
| `apps/web/src/components/outcomes/patient-assessments.tsx` | Modify | Migrate to API client |
| `apps/api/src/patient-portal/patient-portal.service.ts` | Modify | pendingAssessmentsCount |
| `apps/web/src/app/(patient-portal)/patient-portal/page.tsx` | Modify | Teaser card |

---

## CHANTIER 1 — Consentement IA

### Task 1: Backend — AcceptInvitationDto + conditional consent

**Files:**
- Modify: `apps/api/src/patient-portal/dto/patient-auth.dto.ts:4-13`
- Modify: `apps/api/src/patient-portal/patient-auth.service.ts:78-97`

- [ ] **Step 1: Add `consentAi` to AcceptInvitationDto**

In `apps/api/src/patient-portal/dto/patient-auth.dto.ts`, add import and field:

```typescript
import { IsEmail, IsString, MinLength, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ example: 'abc123token' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'MonMotDePasse!1' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ description: 'Consentement traitement IA (RGPD opt-in)' })
  @IsBoolean()
  @IsOptional()
  consentAi?: boolean;
}
```

- [ ] **Step 2: Make ai_processing consent conditional**

In `apps/api/src/patient-portal/patient-auth.service.ts`, replace the `gdprConsent.createMany` block (lines 78-97) inside the `$transaction`:

```typescript
      // Consentements RGPD initiaux
      const consents = [
        { patientId: invitation.patientId, type: 'portal_access', version: '1.0' },
        { patientId: invitation.patientId, type: 'data_processing', version: '1.0' },
      ];
      if (dto.consentAi) {
        consents.push({ patientId: invitation.patientId, type: 'ai_processing', version: '1.0' });
      }
      await tx.gdprConsent.createMany({ data: consents });
```

- [ ] **Step 3: Run tests**

Run:
```bash
cd apps/api && npx vitest run 2>&1 | tail -5
```
Expected: All tests pass (no existing tests for acceptInvitation — it's a service with no test file under `__tests__/`).

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/patient-portal/dto/patient-auth.dto.ts apps/api/src/patient-portal/patient-auth.service.ts
git commit -m "feat(consent): make AI processing consent opt-in at invitation acceptance"
```

---

### Task 2: Backend — hasAiConsent in getInvitationStatus

**Files:**
- Modify: `apps/api/src/patient-portal/patient-invitation.service.ts:89-121`

- [ ] **Step 1: Add gdpr_consents query to getInvitationStatus**

In `apps/api/src/patient-portal/patient-invitation.service.ts`, modify `getInvitationStatus()` (starting at line 89). After the existing `patient` query (line 95-104), add a consent check and include it in the return:

```typescript
  async getInvitationStatus(psychologistUserId: string, patientId: string) {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId: psychologistUserId },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
      include: {
        user: { select: { lastSignInAt: true } },
        invitations: {
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    const hasPortalAccess = !!patient.userId;
    const lastInvitation = patient.invitations[0] ?? null;

    // Check AI processing consent
    const aiConsent = await this.prisma.gdprConsent.findFirst({
      where: { patientId, type: 'ai_processing', withdrawnAt: null },
    });

    return {
      hasPortalAccess,
      hasAiConsent: !!aiConsent,
      lastSignIn: patient.user?.lastSignInAt ?? null,
      invitation: lastInvitation
        ? {
            status: lastInvitation.status,
            email: lastInvitation.email,
            expiresAt: lastInvitation.expiresAt,
          }
        : null,
    };
  }
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd apps/api && npx tsc --noEmit --pretty 2>&1 | head -5
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/patient-portal/patient-invitation.service.ts
git commit -m "feat(consent): add hasAiConsent to portal status response"
```

---

### Task 3: Frontend — Accept invitation consent checkbox

**Files:**
- Modify: `apps/web/src/app/patient/accept-invitation/page.tsx`

- [ ] **Step 1: Update Zod schema and form**

In `apps/web/src/app/patient/accept-invitation/page.tsx`:

1. Update the Zod schema (line 10-18) to add `consentAi`:

```typescript
const schema = z
  .object({
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirm: z.string(),
    consentAi: z.boolean().default(false),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });
```

2. Add the checkbox UI after the confirm password field (before `submitError`), around line 163:

```tsx
            <div className="flex items-start gap-3 pt-2">
              <input
                {...register('consentAi')}
                type="checkbox"
                id="consentAi"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#3D52A0] focus:ring-[#3D52A0]/30"
              />
              <label htmlFor="consentAi" className="text-xs text-slate-500 leading-relaxed">
                J&apos;autorise le traitement de mes données par intelligence artificielle
                pour personnaliser mes exercices thérapeutiques. <span className="text-slate-400">(Optionnel)</span>
              </label>
            </div>
```

3. Update `onSubmit` (line 56-87) to send `consentAi` in the body:

```typescript
      const res = await fetch(`${apiUrl}/api/v1/patient-portal/auth/accept-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password, consentAi: data.consentAi }),
      });
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/patient/accept-invitation/page.tsx
git commit -m "feat(consent): add AI consent checkbox to invitation acceptance form"
```

---

### Task 4: Frontend — AI consent badge + type update

**Files:**
- Modify: `apps/web/src/lib/api/patients.ts:40-45`
- Modify: `apps/web/src/components/patients/patient-portal-section.tsx:7-11,92-119`

- [ ] **Step 1: Update PortalStatus type in patients.ts**

In `apps/web/src/lib/api/patients.ts`, update the `portalStatus` method return type (line 40-45):

```typescript
  portalStatus: (id: string, token: string) =>
    apiClient.get<{
      hasPortalAccess: boolean;
      hasAiConsent: boolean;
      lastSignIn: string | null;
      invitation: { status: string; email: string; expiresAt: string } | null;
    }>(`/patients/${id}/portal-status`, token),
```

- [ ] **Step 2: Update PortalStatus interface and add badge**

In `apps/web/src/components/patients/patient-portal-section.tsx`:

1. Update the `PortalStatus` interface (line 7-11):

```typescript
interface PortalStatus {
  hasPortalAccess: boolean;
  hasAiConsent: boolean;
  lastSignIn: string | null;
  invitation: { status: string; email: string; expiresAt: string } | null;
}
```

2. Add the AI consent badge after the existing "Actif" badge or invite button (inside the `flex items-center gap-2` div, around line 104-118). Add it after the existing conditional block:

```tsx
        <div className="flex items-center gap-2">
          {status?.hasPortalAccess ? (
            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Actif
            </span>
          ) : (
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="inline-flex items-center gap-1.5 text-xs bg-[#3D52A0] text-white rounded-lg px-3 py-1.5 hover:bg-[#2d3f7c] transition-colors disabled:opacity-60"
            >
              {inviting ? 'Envoi...' : status?.invitation?.status === 'pending' ? 'Renvoyer l\'invitation' : 'Inviter au portal'}
            </button>
          )}
          {status?.hasPortalAccess && (
            <span className={`inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1 ${
              status.hasAiConsent
                ? 'bg-violet-50 text-violet-700 border border-violet-200'
                : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              {status.hasAiConsent ? 'IA autorisée' : 'IA non autorisée'}
            </span>
          )}
        </div>
```

- [ ] **Step 3: Verify compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/api/patients.ts apps/web/src/components/patients/patient-portal-section.tsx
git commit -m "feat(consent): display AI consent badge in patient portal section"
```

---

## CHANTIER 2 — Exercices IA

### Task 5: Backend — CreateExerciseDto + service + controller

**Files:**
- Modify: `apps/api/src/patients/dto/create-patient.dto.ts`
- Modify: `apps/api/src/patients/patients.service.ts`
- Modify: `apps/api/src/patients/patients.controller.ts`

- [ ] **Step 1: Add CreateExerciseDto**

In `apps/api/src/patients/dto/create-patient.dto.ts`, add at the bottom of the file:

```typescript
export class CreateExerciseDto {
  @ApiProperty({ example: 'Respiration 4-7-8' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Inspirez pendant 4 secondes...' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({ example: '2026-04-20' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  createdByAi!: boolean;
}
```

Add `IsBoolean` to the imports from `class-validator` (line 1):

```typescript
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
```

- [ ] **Step 2: Add createExercise service method**

In `apps/api/src/patients/patients.service.ts`, add the method after `getPatientPortalExercises()` (around line 321):

```typescript
  async createExercise(
    psychologistUserId: string,
    patientId: string,
    dto: CreateExerciseDto,
  ) {
    const psy = await this.getPsychologist(psychologistUserId);
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    return this.prisma.exercise.create({
      data: {
        patientId,
        title: dto.title,
        description: dto.description,
        status: 'assigned',
        createdByAi: dto.createdByAi,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }
```

Add the import for `CreateExerciseDto` in the import statement at the top:

```typescript
import { CreatePatientDto, UpdatePatientDto, PatientQueryDto, CreateExerciseDto } from './dto/create-patient.dto';
```

- [ ] **Step 3: Add controller route**

In `apps/api/src/patients/patients.controller.ts`, add the route after the `getPatientExercises` route (after line 185):

```typescript
  @Post(':id/exercises')
  @ApiOperation({ summary: 'Créer un exercice pour un patient' })
  @ApiResponse({ status: 201, description: 'Exercice créé' })
  createExercise(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateExerciseDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.patientsService.createExercise(user.sub, id, dto);
  }
```

Add `CreateExerciseDto` to the import from `./dto/create-patient.dto` (line 27):

```typescript
import { CreatePatientDto, UpdatePatientDto, PatientQueryDto, CreateExerciseDto } from './dto/create-patient.dto';
```

- [ ] **Step 4: Verify compilation and tests**

Run:
```bash
cd apps/api && npx tsc --noEmit --pretty 2>&1 | head -5
```

Run:
```bash
cd apps/api && npx vitest run 2>&1 | tail -5
```
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/patients/dto/create-patient.dto.ts apps/api/src/patients/patients.service.ts apps/api/src/patients/patients.controller.ts
git commit -m "feat(exercises): add POST /patients/:id/exercises endpoint"
```

---

### Task 6: Frontend API — createExercise + generateExercise

**Files:**
- Modify: `apps/web/src/lib/api/patients.ts`
- Modify: `apps/web/src/lib/api/ai.ts`

- [ ] **Step 1: Add createExercise to patients API client**

In `apps/web/src/lib/api/patients.ts`, add after `portalExercises` (line 56):

```typescript
  createExercise: (
    patientId: string,
    data: { title: string; description: string; dueDate?: string; createdByAi: boolean },
    token: string,
  ) =>
    apiClient.post<{ id: string; title: string; status: string }>(
      `/patients/${patientId}/exercises`,
      data,
      token,
    ),
```

- [ ] **Step 2: Add generateExercise to AI client**

In `apps/web/src/lib/api/ai.ts`, add after the `streamSessionSummary` function (at the end of the file, before the closing):

```typescript
export interface GenerateExerciseParams {
  patientContext: string;
  theme: string;
  exerciseType: 'breathing' | 'journaling' | 'exposure' | 'mindfulness' | 'cognitive';
}

export interface GeneratedExercise {
  title: string;
  description: string;
  instructions: string[];
  duration: string;
  frequency: string;
  disclaimer: string;
}

export async function generateExercise(
  params: GenerateExerciseParams,
  token: string,
): Promise<GeneratedExercise> {
  const res = await fetch(`${API_BASE}/api/v1/ai/generate-exercise`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Erreur ${res.status}`);
  }

  return res.json() as Promise<GeneratedExercise>;
}
```

- [ ] **Step 3: Verify compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/api/patients.ts apps/web/src/lib/api/ai.ts
git commit -m "feat(exercises): add createExercise and generateExercise API clients"
```

---

### Task 7: Frontend — ExerciseDialog component

**Files:**
- Create: `apps/web/src/components/patients/exercise-dialog.tsx`

- [ ] **Step 1: Create the dialog component**

Create `apps/web/src/components/patients/exercise-dialog.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { patientsApi } from '@/lib/api/patients';
import { generateExercise } from '@/lib/api/ai';
import type { GeneratedExercise } from '@/lib/api/ai';

interface ExerciseDialogProps {
  patientId: string;
  hasAiConsent: boolean;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const manualSchema = z.object({
  title: z.string().min(3, 'Minimum 3 caractères').max(200),
  description: z.string().min(10, 'Minimum 10 caractères').max(5000),
  dueDate: z.string().optional(),
});

const aiSchema = z.object({
  theme: z.string().min(2, 'Thème requis').max(200),
  exerciseType: z.enum(['breathing', 'journaling', 'exposure', 'mindfulness', 'cognitive']),
  patientContext: z.string().min(1, 'Contexte requis').max(500),
});

type ManualForm = z.infer<typeof manualSchema>;
type AiForm = z.infer<typeof aiSchema>;

const EXERCISE_TYPES = [
  { value: 'breathing', label: 'Respiration' },
  { value: 'journaling', label: 'Journal' },
  { value: 'exposure', label: 'Exposition progressive' },
  { value: 'mindfulness', label: 'Pleine conscience' },
  { value: 'cognitive', label: 'Cognitif' },
] as const;

export function ExerciseDialog({ patientId, hasAiConsent, open, onClose, onCreated }: ExerciseDialogProps) {
  const { data: session } = useSession();
  const [tab, setTab] = useState<'manual' | 'ai'>('manual');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedExercise | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const manual = useForm<ManualForm>({ resolver: zodResolver(manualSchema) });
  const ai = useForm<AiForm>({
    resolver: zodResolver(aiSchema),
    defaultValues: { exerciseType: 'breathing' },
  });

  if (!open) return null;
  const token = session?.accessToken ?? '';

  const handleManualSubmit = async (data: ManualForm) => {
    setSaving(true);
    setError(null);
    try {
      await patientsApi.createExercise(patientId, { ...data, createdByAi: false }, token);
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (data: AiForm) => {
    setGenerating(true);
    setError(null);
    setGenerated(null);
    try {
      const result = await generateExercise(data, token);
      setGenerated(result);
      setEditedTitle(result.title);
      setEditedDescription(result.description);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de génération IA');
    } finally {
      setGenerating(false);
    }
  };

  const handleAssignGenerated = async () => {
    if (!editedTitle || !editedDescription) return;
    setSaving(true);
    setError(null);
    try {
      await patientsApi.createExercise(
        patientId,
        { title: editedTitle, description: editedDescription, createdByAi: true },
        token,
      );
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'assignation');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setGenerated(null);
    setError(null);
    manual.reset();
    ai.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/30 focus:border-[#3D52A0]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Nouvel exercice</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setTab('manual'); setGenerated(null); setError(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'manual' ? 'text-[#3D52A0] border-b-2 border-[#3D52A0]' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <PenLine size={14} className="inline mr-1.5" />
            Manuel
          </button>
          <button
            onClick={() => { setTab('ai'); setError(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'ai' ? 'text-[#3D52A0] border-b-2 border-[#3D52A0]' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles size={14} className="inline mr-1.5" />
            IA
          </button>
        </div>

        <div className="p-6">
          {/* Manual tab */}
          {tab === 'manual' && (
            <form onSubmit={manual.handleSubmit(handleManualSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                <input {...manual.register('title')} className={inputClass} placeholder="Ex: Respiration 4-7-8" />
                {manual.formState.errors.title && (
                  <p className="mt-1 text-xs text-red-500">{manual.formState.errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea {...manual.register('description')} rows={4} className={inputClass} placeholder="Instructions détaillées..." />
                {manual.formState.errors.description && (
                  <p className="mt-1 text-xs text-red-500">{manual.formState.errors.description.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date limite (optionnel)</label>
                <input {...manual.register('dueDate')} type="date" className={inputClass} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={handleClose}>Annuler</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 size={14} className="animate-spin mr-1.5" />Création...</> : 'Assigner'}
                </Button>
              </div>
            </form>
          )}

          {/* AI tab */}
          {tab === 'ai' && !hasAiConsent && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">
                Ce patient n&apos;a pas autorisé le traitement IA.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Utilisez l&apos;onglet Manuel pour créer un exercice.
              </p>
            </div>
          )}

          {tab === 'ai' && hasAiConsent && !generated && (
            <form onSubmit={ai.handleSubmit(handleGenerate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thème</label>
                <input {...ai.register('theme')} className={inputClass} placeholder="Ex: Gestion de l'anxiété sociale" />
                {ai.formState.errors.theme && (
                  <p className="mt-1 text-xs text-red-500">{ai.formState.errors.theme.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type d&apos;exercice</label>
                <select {...ai.register('exerciseType')} className={inputClass}>
                  {EXERCISE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contexte patient</label>
                <textarea {...ai.register('patientContext')} rows={3} className={inputClass} placeholder="Contexte anonymisé du patient..." />
                {ai.formState.errors.patientContext && (
                  <p className="mt-1 text-xs text-red-500">{ai.formState.errors.patientContext.message}</p>
                )}
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={handleClose}>Annuler</Button>
                <Button type="submit" disabled={generating}>
                  {generating ? <><Loader2 size={14} className="animate-spin mr-1.5" />Génération...</> : <><Sparkles size={14} className="mr-1.5" />Générer</>}
                </Button>
              </div>
            </form>
          )}

          {/* AI preview */}
          {tab === 'ai' && hasAiConsent && generated && (
            <div className="space-y-4">
              <div className="rounded-lg bg-violet-50 border border-violet-200 p-3 text-xs text-violet-700">
                Exercice généré par IA — modifiez avant d&apos;assigner
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                <input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} rows={4} className={inputClass} />
              </div>
              {generated.instructions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Instructions (lecture seule)</label>
                  <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1 bg-slate-50 rounded-lg p-3">
                    {generated.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ol>
                  <p className="text-xs text-slate-400 mt-1">
                    Intégrez les instructions dans la description si nécessaire.
                  </p>
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setGenerated(null)}>Regénérer</Button>
                <Button onClick={handleAssignGenerated} disabled={saving}>
                  {saving ? <><Loader2 size={14} className="animate-spin mr-1.5" />Assignation...</> : 'Assigner'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/patients/exercise-dialog.tsx
git commit -m "feat(exercises): create ExerciseDialog with manual and AI tabs"
```

---

### Task 8: Frontend — PatientPortalSection exercise button

**Files:**
- Modify: `apps/web/src/components/patients/patient-portal-section.tsx`

- [ ] **Step 1: Add button and dialog integration**

In `apps/web/src/components/patients/patient-portal-section.tsx`:

1. Add imports at the top:

```typescript
import { Plus } from 'lucide-react';
import { ExerciseDialog } from './exercise-dialog';
```

2. Add state for the dialog (after line 45 `inviteResult` state):

```typescript
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
```

3. Add refresh handler (after `handleInvite` function, around line 84):

```typescript
  const refreshExercises = () => {
    if (!session?.accessToken) return;
    patientsApi
      .portalExercises(patientId, session.accessToken)
      .then(setExercises)
      .catch(console.error);
  };
```

4. Replace the exercises section header (line 173) to add the button:

```tsx
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">Exercices</h4>
                <button
                  onClick={() => setExerciseDialogOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-[#3D52A0] hover:text-[#2d3f7c] font-medium"
                >
                  <Plus size={14} />
                  Nouvel exercice
                </button>
              </div>
```

Note: The current code only shows exercises if `exercises.length > 0` (lines 171-198). Replace the **entire exercises block** (lines 170-198) with:

**BEFORE (lines 170-198):**
```tsx
          {/* Exercises */}
          {exercises.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Exercices</h4>
              <div className="space-y-2">
                {exercises.slice(0, 5).map((e) => (
                  ...existing exercise items...
                ))}
              </div>
            </div>
          )}
```

**AFTER (complete replacement):**
```tsx
          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">Exercices</h4>
              <button
                onClick={() => setExerciseDialogOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-[#3D52A0] hover:text-[#2d3f7c] font-medium"
              >
                <Plus size={14} />
                Nouvel exercice
              </button>
            </div>
            {exercises.length > 0 ? (
              <div className="space-y-2">
                {exercises.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        e.status === 'completed'
                          ? 'bg-emerald-500'
                          : e.status === 'in_progress'
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span className="flex-1 truncate text-foreground">{e.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {e.status === 'completed'
                        ? '✓ Terminé'
                        : e.status === 'in_progress'
                        ? 'En cours'
                        : 'À faire'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun exercice assigné</p>
            )}
          </div>
```

This removes the `{exercises.length > 0 && (` conditional wrapper so the section always renders (button visible even with no exercises), and adds an empty state fallback.

5. Add the dialog at the end of the component, before the closing `</section>`:

```tsx
      <ExerciseDialog
        patientId={patientId}
        hasAiConsent={status?.hasAiConsent ?? false}
        open={exerciseDialogOpen}
        onClose={() => setExerciseDialogOpen(false)}
        onCreated={refreshExercises}
      />
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/patients/patient-portal-section.tsx
git commit -m "feat(exercises): add exercise button and dialog to portal section"
```

---

## CHANTIER 3 — Cleanup API

### Task 9: Frontend — patient-portal.ts types + methods

**Files:**
- Modify: `apps/web/src/lib/api/patient-portal.ts`

- [ ] **Step 1: Add types and methods**

In `apps/web/src/lib/api/patient-portal.ts`, add the types after the existing `PatientDashboard` interface (after line 49):

```typescript
export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  psychologist: { name: string; specialization: string };
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  minValue: number;
  maxValue: number;
  labels: string[];
}

export interface AssessmentTemplate {
  type: string;
  name: string;
  description: string | null;
  maxScore: number;
  questions: AssessmentQuestion[];
}

export interface PendingAssessment {
  id: string;
  status: string;
  template: AssessmentTemplate;
  createdAt: string;
}

export interface CompletedAssessment {
  id: string;
  score: number | null;
  severity: string | null;
  status: string;
  completedAt: string | null;
  template: { type: string; name: string; maxScore: number };
}

export interface AssessmentSubmitResult {
  score: number;
  maxScore: number;
  severity: string;
}
```

Update the `PatientDashboard` interface to add `pendingAssessmentsCount`:

```typescript
export interface PatientDashboard {
  avgMood7d: number | null;
  moodHistory: { mood: number; createdAt: string }[];
  pendingExercises: Exercise[];
  nextAppointment: { scheduledAt: string; duration: number; status: string } | null;
  journalCount: number;
  pendingAssessmentsCount: number;
}
```

Add the methods to the `patientPortalApi` object (after `deleteJournalEntry`):

```typescript
  getProfile: (token: string) => fetchPortal<PatientProfile>('/me', token),

  getAssessments: (token: string) =>
    fetchPortal<Array<PendingAssessment | CompletedAssessment>>('/assessments', token),

  submitAssessment: (token: string, id: string, answers: Record<string, number>) =>
    fetchPortal<AssessmentSubmitResult>(`/assessments/${id}/submit`, token, {
      method: 'POST',
      body: JSON.stringify({
        answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
      }),
    }),
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/api/patient-portal.ts
git commit -m "feat(portal): add assessment types and methods to patient-portal API client"
```

---

### Task 10: Frontend — Migrate patient-assessments to API client

**Files:**
- Modify: `apps/web/src/components/outcomes/patient-assessments.tsx`

- [ ] **Step 1: Replace fetch calls with API client**

In `apps/web/src/components/outcomes/patient-assessments.tsx`:

1. Replace local type definitions (lines 9-41) with imports:

```typescript
import { patientPortalApi } from '@/lib/api/patient-portal';
import type {
  PendingAssessment,
  CompletedAssessment,
  AssessmentQuestion,
  AssessmentTemplate,
} from '@/lib/api/patient-portal';
```

Remove the local `Question`, `Template`, `PendingAssessment`, `CompletedAssessment`, and `Assessment` interfaces.

Keep `type Assessment = PendingAssessment | CompletedAssessment;`

2. Replace the `fetch` call for loading assessments (find the `useEffect` that calls `fetch`). Replace with:

```typescript
  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    patientPortalApi.getAssessments(session.accessToken)
      .then((data) => {
        setAssessments(data);
      })
      .catch(() => setError('Impossible de charger les évaluations'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);
```

3. Replace the `fetch` call for submitting an assessment. Find the submit handler and replace with:

```typescript
    patientPortalApi.submitAssessment(session.accessToken, activeId, answers)
      .then((result) => {
        // Update assessment in local state with result
        setAssessments((prev) =>
          prev.map((a) =>
            a.id === activeId
              ? { ...a, status: 'completed', score: result.score, severity: result.severity, completedAt: new Date().toISOString(), template: { ...('template' in a ? a.template : { type: '', name: '', maxScore: 0 }), maxScore: result.maxScore } }
              : a,
          ),
        );
        setActiveId(null);
      })
      .catch(() => setError('Erreur lors de la soumission'));
```

Note: The exact replacement depends on the existing submit logic. Adapt to match the component's current state management pattern. The key change is replacing raw `fetch()` with `patientPortalApi.submitAssessment()`.

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/outcomes/patient-assessments.tsx
git commit -m "refactor(assessments): migrate to shared patient-portal API client"
```

---

### Task 11: Backend — pendingAssessmentsCount in getDashboard

**Files:**
- Modify: `apps/api/src/patient-portal/patient-portal.service.ts:242-284`

- [ ] **Step 1: Add assessment count to getDashboard**

In `apps/api/src/patient-portal/patient-portal.service.ts`, modify `getDashboard()` (line 242).

Update the `Promise.all` to add a 5th query:

```typescript
  async getDashboard(patientId: string) {
    const [recentMoods, exercises, nextAppointment, recentJournal, pendingAssessmentsCount] = await Promise.all([
      // 7 derniers jours d'humeur
      this.prisma.moodTracking.findMany({
        where: {
          patientId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'asc' },
        select: { mood: true, createdAt: true },
      }),
      // Exercices en attente
      this.prisma.exercise.findMany({
        where: { patientId, status: { in: ['assigned', 'in_progress'] } },
        take: 5,
        orderBy: { dueDate: 'asc' },
      }),
      // Prochain RDV
      this.prisma.appointment.findFirst({
        where: {
          patientId,
          status: { in: ['scheduled', 'confirmed'] },
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: 'asc' },
        select: { scheduledAt: true, duration: true, status: true },
      }),
      // Dernières entrées journal (sans contenu déchiffré ici — juste le count)
      this.prisma.journalEntry.count({ where: { patientId } }),
      // Évaluations en attente
      this.prisma.assessment.count({ where: { patientId, status: 'pending' } }),
    ]);

    const avgMood = recentMoods.length
      ? recentMoods.reduce((s, m) => s + m.mood, 0) / recentMoods.length
      : null;

    return {
      avgMood7d: avgMood ? Math.round(avgMood * 10) / 10 : null,
      moodHistory: recentMoods,
      pendingExercises: exercises,
      nextAppointment,
      journalCount: recentJournal,
      pendingAssessmentsCount,
    };
  }
```

- [ ] **Step 2: Verify compilation and tests**

Run:
```bash
cd apps/api && npx tsc --noEmit --pretty 2>&1 | head -5
```

Run:
```bash
cd apps/api && npx vitest run 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/patient-portal/patient-portal.service.ts
git commit -m "feat(dashboard): add pendingAssessmentsCount to patient dashboard"
```

---

### Task 12: Frontend — Assessments teaser card on dashboard

**Files:**
- Modify: `apps/web/src/app/(patient-portal)/patient-portal/page.tsx`

- [ ] **Step 1: Add assessments teaser card**

In `apps/web/src/app/(patient-portal)/patient-portal/page.tsx`, find the dashboard rendering section. The dashboard data already includes `pendingAssessmentsCount` (from Task 11 + Task 9 type update).

Add `import { ClipboardList } from 'lucide-react';` at the top of the file.

Add a teaser card after the journal section (or wherever appropriate in the layout). Look for the journal teaser card pattern and add a similar one:

```tsx
        {dashboard.pendingAssessmentsCount > 0 && (
          <a
            href="/patient-portal/assessments"
            className="block rounded-xl border border-amber-200 bg-amber-50 p-4 hover:border-amber-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Évaluations en attente</h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  {dashboard.pendingAssessmentsCount} évaluation{dashboard.pendingAssessmentsCount > 1 ? 's' : ''} à compléter
                </p>
              </div>
              <ClipboardList className="h-5 w-5 text-amber-600" />
            </div>
          </a>
        )}
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 3: Full build check**

Run:
```bash
cd apps/web && npx next build 2>&1 | tail -10
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(patient-portal\)/patient-portal/page.tsx
git commit -m "feat(dashboard): add assessments teaser card to patient portal"
```
