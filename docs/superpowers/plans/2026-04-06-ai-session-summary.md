# AI Session Summary — Agent Contextuel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing AI session summary from a basic one-shot to a 3-phase contextual agent with patient history, orientation-aware prompts, structured extraction, and persistence.

**Architecture:** 3-phase pipeline — Phase 1 collects patient history from DB (no LLM), Phase 2 streams a narrative summary via Sonnet, Phase 3 extracts structured JSON via Haiku. Frontend saves explicitly via PUT /sessions/:id.

**Tech Stack:** NestJS, Prisma, Anthropic/OpenAI API, Next.js, React, SSE streaming, AES-256-GCM encryption

**Spec:** `docs/superpowers/specs/2026-04-06-ai-session-summary-design.md`

---

### Task 1: Prisma Migration — Add `aiMetadata` Column

**Files:**
- Modify: `apps/api/prisma/schema.prisma:354-378` (Session model)
- Create: `apps/api/prisma/migrations/YYYYMMDD_add_ai_metadata/migration.sql`

- [ ] **Step 1: Add `aiMetadata` field to Session model in Prisma schema**

In `apps/api/prisma/schema.prisma`, add after the `templateId` field (line 367):

```prisma
  aiMetadata     Json?                @map("ai_metadata")
```

The full Session model should now include:
```prisma
model Session {
  id             String               @id @default(uuid())
  patientId      String               @map("patient_id")
  psychologistId String               @map("psychologist_id")
  date           DateTime
  duration       Int // minutes
  type           SessionType          @default(individual)
  notes          String? // ENCRYPTED — AES-256-GCM
  summaryAi      String?              @map("summary_ai") // ENCRYPTED si contient données patients
  tags           String[]
  rate           Decimal?             @db.Decimal(10, 2)
  paymentStatus  SessionPaymentStatus @default(pending) @map("payment_status")
  orientation    TherapyOrientation?
  templateId     String?              @map("template_id")
  aiMetadata     Json?                @map("ai_metadata")
  createdAt      DateTime             @default(now()) @map("created_at")

  // Relations
  patient      Patient      @relation(fields: [patientId], references: [id], onDelete: Cascade)
  psychologist Psychologist @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  appointment  Appointment?

  @@index([patientId], name: "idx_sessions_patient")
  @@index([psychologistId, date(sort: Desc)], name: "idx_sessions_psy_date")
  @@map("sessions")
}
```

- [ ] **Step 2: Generate the migration**

Run:
```bash
cd apps/api && npx prisma migrate dev --name add_ai_metadata
```

Expected: Migration created successfully, `prisma generate` runs automatically.

- [ ] **Step 3: Verify the generated SQL**

Check the migration file. It should contain:
```sql
ALTER TABLE "sessions" ADD COLUMN "ai_metadata" JSONB;
```

- [ ] **Step 4: Run `prisma generate` to confirm client types**

Run:
```bash
cd apps/api && npx prisma generate
```

Expected: Prisma Client generated with `aiMetadata` as `Prisma.JsonValue | null`.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(prisma): add aiMetadata Json column to Session model"
```

---

### Task 2: Orientation-Aware Prompt Builder

**Files:**
- Create: `apps/api/src/ai/prompts/session-summary.prompts.ts`

- [ ] **Step 1: Create the prompts directory if needed**

Run:
```bash
ls apps/api/src/ai/prompts/ 2>/dev/null || mkdir -p apps/api/src/ai/prompts
```

- [ ] **Step 2: Write the prompt builder file**

Create `apps/api/src/ai/prompts/session-summary.prompts.ts`:

```typescript
import { TherapyOrientation } from '@prisma/client';

const BASE_PROMPT = `Tu es un assistant clinique pour psychologues. Tu as accès à l'historique du patient.

MISSION :
Génère un résumé structuré de la séance en tenant compte de l'évolution du patient.

FORMAT DE SORTIE (Markdown) :

## Résumé de séance
[Synthèse 3-4 phrases, incluant le contexte de la relation thérapeutique]

## Évolution depuis la dernière séance
[Compare avec les séances précédentes : progrès, stagnation, régression.
Cite des éléments concrets de l'historique.
Si aucun historique disponible, indique "Première séance enregistrée — pas de comparaison possible."]

## Thèmes abordés
- [thème] (nouveau / récurrent depuis [date])

## Plan thérapeutique
- [objectifs court terme]
- [techniques à poursuivre/ajuster]

## Points de vigilance
- [alertes cliniques : idéation suicidaire, décompensation, rupture alliance, etc.]
- [Si aucun point de vigilance : "Aucun point de vigilance identifié"]

## Suggestions prochaine séance
- [Recommandations contextualisées basées sur l'évolution]

RÈGLES ABSOLUES :
- N'invente AUCUNE information non présente dans les notes
- Si l'historique est insuffisant, dis-le plutôt que de spéculer
- Ce résumé est un OUTIL D'AIDE — le praticien reste seul responsable
- Utilise un langage clinique professionnel mais accessible`;

const ORIENTATION_ADDITIONS: Record<string, string> = {
  TCC: `

ORIENTATION TCC :
- Identifie les pensées automatiques et schémas cognitifs mentionnés
- Note les comportements cibles et leur évolution
- Évalue l'avancement des exercices entre séances (exposition, restructuration cognitive)
- Utilise le vocabulaire TCC : schéma, pensée automatique, distorsion cognitive, renforcement`,

  PSYCHODYNAMIQUE: `

ORIENTATION PSYCHODYNAMIQUE :
- Repère les éléments de transfert et contre-transfert
- Identifie les mécanismes de défense observés
- Note les associations libres significatives
- Évalue l'évolution de l'alliance thérapeutique
- Utilise le vocabulaire analytique : transfert, résistance, acting out, insight`,

  SYSTEMIQUE: `

ORIENTATION SYSTÉMIQUE :
- Identifie les patterns relationnels et interactions familiales
- Note les changements dans le contexte systémique
- Repère les alliances, coalitions et triangulations
- Évalue les effets des prescriptions paradoxales ou recadrages
- Utilise le vocabulaire systémique : homéostasie, circularité, double lien`,

  ACT: `

ORIENTATION ACT :
- Évalue la flexibilité psychologique du patient
- Identifie les comportements d'évitement expérientiel
- Note le travail sur les valeurs et l'engagement
- Repère les exercices de défusion cognitive et pleine conscience
- Utilise le vocabulaire ACT : fusion, défusion, acceptation, valeurs, soi-contexte`,
};

export const EXTRACTION_PROMPT = `Extrais les données structurées du résumé de séance ci-dessous.

Réponds UNIQUEMENT en JSON valide, sans texte autour :
{
  "tags": ["liste de 3-7 tags cliniques courts"],
  "evolution": "progress | stable | regression | mixed",
  "alertLevel": "none | low | medium | high",
  "alertReason": "raison de l'alerte ou null si none",
  "keyThemes": ["2-4 thèmes principaux en phrases courtes"]
}

Règles :
- "evolution" compare avec les séances précédentes mentionnées dans le résumé
- "alertLevel" = "high" si idéation suicidaire, automutilation, décompensation aiguë
- "alertLevel" = "medium" si rupture alliance, absence répétée, détérioration significative
- "alertLevel" = "low" si stagnation prolongée, résistance au traitement
- Tags en français, tout en minuscules`;

/**
 * Returns the full system prompt for session summary generation.
 * Appends orientation-specific additions if applicable.
 * AUTRE or null → base prompt only.
 */
export function getSessionSummaryPrompt(
  orientation: TherapyOrientation | null,
): string {
  if (!orientation || orientation === 'AUTRE') {
    return BASE_PROMPT;
  }
  return BASE_PROMPT + (ORIENTATION_ADDITIONS[orientation] ?? '');
}
```

- [ ] **Step 3: Verify file compiles**

Run:
```bash
cd apps/api && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors in `session-summary.prompts.ts`.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/ai/prompts/session-summary.prompts.ts
git commit -m "feat(ai): add orientation-aware session summary prompt builder"
```

---

### Task 3: UpdateSessionDto — Add `summaryAi` + `aiMetadata`

**Files:**
- Modify: `apps/api/src/sessions/dto/session.dto.ts:66-116`

- [ ] **Step 1: Add new fields to UpdateSessionDto**

In `apps/api/src/sessions/dto/session.dto.ts`, add these imports at top (add `IsObject` to the existing import):

```typescript
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  IsArray,
  IsUUID,
  IsObject,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
```

Then add these two fields at the end of `UpdateSessionDto` (before the closing `}`), after `templateId`:

```typescript
  @ApiPropertyOptional({ description: 'Résumé IA (plaintext — chiffré par le backend)' })
  @IsString()
  @IsOptional()
  @MaxLength(100000)
  summaryAi?: string;

  @ApiPropertyOptional({ description: 'Métadonnées IA (evolution, alertes, thèmes)' })
  @IsOptional()
  @IsObject()
  aiMetadata?: Record<string, unknown>;
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd apps/api && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/sessions/dto/session.dto.ts
git commit -m "feat(dto): add summaryAi and aiMetadata to UpdateSessionDto"
```

---

### Task 4: Shared Types — Add `aiMetadata` to Session Interface

**Files:**
- Modify: `packages/shared-types/src/index.ts:171-184` (Session interface)

- [ ] **Step 1: Add `aiMetadata` and `orientation` fields to Session interface**

In `packages/shared-types/src/index.ts`, the `Session` interface (lines 171-184) is missing `aiMetadata` and `orientation`. Add them:

```typescript
export interface Session {
  id: string;
  patientId: string;
  psychologistId: string;
  date: Date;
  duration: number;
  type: SessionType;
  notes: string | null; // chiffré en DB
  summaryAi: string | null;
  tags: string[];
  rate: number | null;
  paymentStatus: SessionPaymentStatus;
  orientation?: string | null;
  aiMetadata?: Record<string, unknown> | null;
  createdAt: Date;
}
```

- [ ] **Step 2: Verify compilation across packages**

Run:
```bash
cd packages/shared-types && npx tsc --noEmit --pretty 2>&1 | head -10
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -10
```

Expected: No errors. The `sessionsApi.update()` in `apps/web/src/lib/api/sessions.ts` uses `Partial<Session>` so `summaryAi` and `aiMetadata` are now valid without `as never` casts.

- [ ] **Step 3: Commit**

```bash
git add packages/shared-types/src/index.ts
git commit -m "feat(types): add aiMetadata and orientation to Session interface"
```

---

### Task 5: sessions.service.ts — Encrypt `summaryAi` + Audit Log on Save

**Files:**
- Modify: `apps/api/src/sessions/sessions.service.ts:170-211` (update method)

- [ ] **Step 1: Modify the `update()` method to handle `summaryAi` encryption and `aiMetadata` pass-through**

In `sessions.service.ts`, replace the `update()` method (lines 170-212):

```typescript
  async update(
    psychologistUserId: string,
    sessionId: string,
    dto: UpdateSessionDto,
    actorId: string,
    req?: Request,
  ): Promise<Session> {
    const psy = await this.getPsychologist(psychologistUserId);

    const existing = await this.prisma.session.findFirst({
      where: { id: sessionId, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('Séance introuvable');

    const hasSummaryAi = dto.summaryAi !== undefined;

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.notes !== undefined && {
          notes: dto.notes ? this.encryption.encrypt(dto.notes) : null,
        }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.rate !== undefined && { rate: dto.rate }),
        ...(dto.paymentStatus !== undefined && { paymentStatus: dto.paymentStatus }),
        ...(dto.orientation !== undefined && { orientation: dto.orientation }),
        ...(dto.templateId !== undefined && { templateId: dto.templateId }),
        ...(hasSummaryAi && {
          summaryAi: dto.summaryAi ? this.encryption.encrypt(dto.summaryAi) : null,
        }),
        ...(dto.aiMetadata !== undefined && { aiMetadata: dto.aiMetadata ?? undefined }),
      },
    });

    // Standard update audit
    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'session',
      entityId: sessionId,
      metadata: { fields: Object.keys(dto) },
      req,
    });

    // Additional audit entry for AI summary save
    if (hasSummaryAi) {
      await this.audit.log({
        actorId,
        actorType: 'psychologist',
        action: 'AI_SUMMARY_SAVE',
        entityType: 'session',
        entityId: sessionId,
        req,
      });
    }

    return updated;
  }
```

- [ ] **Step 2: Verify `findOne()` already returns `aiMetadata`**

Check `findOne()` (line 136-168). It uses `include: { patient: ... }` which returns all fields including `aiMetadata`. The `summaryAi` decryption is already handled. **No changes needed** — `aiMetadata` is a JSON field returned as-is.

- [ ] **Step 3: Verify compilation**

Run:
```bash
cd apps/api && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Run existing tests**

Run:
```bash
cd apps/api && npx vitest run src/sessions/ --reporter=verbose 2>&1 | tail -20
```

Expected: All existing session tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/sessions/sessions.service.ts
git commit -m "feat(sessions): encrypt summaryAi on save + AI_SUMMARY_SAVE audit log"
```

---

### Task 6: ai.service.ts — 3-Phase Pipeline (Backend Core)

This is the largest task. Rewrite `streamSessionSummary()` and add helper methods.

**Files:**
- Modify: `apps/api/src/ai/ai.service.ts` (major rewrite of streaming method + new helpers)

**Context:**
- Current `streamSessionSummary()` is at lines 136-181
- `streamWithAnthropic()` is at lines 239-310
- `streamWithOpenAI()` is at lines 312-369
- `trackUsage()` is at lines 476-501

- [ ] **Step 1: Add import for the prompt builder at top of file**

Add after existing imports:

```typescript
import { EncryptionService } from '../common/encryption.service';
import {
  getSessionSummaryPrompt,
  EXTRACTION_PROMPT,
} from './prompts/session-summary.prompts';
```

Add `EncryptionService` to the constructor:

```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly config: ConfigService,
  private readonly encryption: EncryptionService,
) {}
```

- [ ] **Step 2: Add `collectPatientHistory()` private method**

Add this method to the `AiService` class:

```typescript
  /**
   * Phase 1: Collect last 15 sessions for the patient, decrypt summaries/notes.
   * Returns a formatted dossier string for the LLM context.
   * MUST filter by psychologistId for tenant isolation.
   */
  private async collectPatientHistory(
    sessionId: string,
    psychologistId: string,
  ): Promise<{ dossier: string; orientation: string | null; date: Date | null; duration: number | null }> {
    const currentSession = await this.prisma.session.findFirst({
      where: { id: sessionId, psychologistId },
      select: { patientId: true, orientation: true, date: true, duration: true },
    });

    if (!currentSession) {
      return { dossier: 'Aucun historique disponible', orientation: null, date: null, duration: null };
    }

    const pastSessions = await this.prisma.session.findMany({
      where: {
        patientId: currentSession.patientId,
        psychologistId,
        id: { not: sessionId },
      },
      orderBy: { date: 'desc' },
      take: 15,
      select: {
        date: true,
        duration: true,
        orientation: true,
        tags: true,
        notes: true,
        summaryAi: true,
      },
    });

    if (pastSessions.length === 0) {
      return {
        dossier: 'Aucun historique disponible',
        orientation: currentSession.orientation,
        date: currentSession.date,
        duration: currentSession.duration,
      };
    }

    const entries = pastSessions.map((s) => {
      const dateStr = s.date.toISOString().split('T')[0];
      const orientationStr = s.orientation ?? 'Non spécifiée';
      const tagsStr = s.tags.length > 0 ? `Tags: ${s.tags.join(', ')}` : '';

      let summaryText = 'Pas de résumé disponible';
      try {
        if (s.summaryAi) {
          summaryText = this.encryption.decrypt(s.summaryAi);
          // Truncate long summaries
          if (summaryText.length > 800) {
            summaryText = summaryText.slice(0, 800) + '...';
          }
        } else if (s.notes) {
          const decryptedNotes = this.encryption.decrypt(s.notes);
          summaryText = decryptedNotes.slice(0, 500) + (decryptedNotes.length > 500 ? '...' : '');
        }
      } catch {
        // Decryption failure for a past session — skip silently
        summaryText = '[Notes indisponibles]';
      }

      return [
        `[${dateStr}] Séance ${s.duration}min (${orientationStr})`,
        tagsStr,
        `Résumé: ${summaryText}`,
        '',
      ].filter(Boolean).join('\n');
    });

    return {
      dossier: `=== Historique patient (${pastSessions.length} dernières séances) ===\n\n${entries.join('\n')}`,
      orientation: currentSession.orientation,
      date: currentSession.date,
      duration: currentSession.duration,
    };
  }
```

- [ ] **Step 3: Add `extractStructuredData()` private method**

```typescript
  /**
   * Phase 3: Extract structured JSON from the narrative summary using Haiku.
   * Returns parsed data or null on failure.
   */
  private async extractStructuredData(
    summaryText: string,
    psychologistId: string,
  ): Promise<{ data: Record<string, unknown>; tokens: number } | null> {
    const apiKey = this.requireAiKey();
    const startedAt = Date.now();

    try {
      if (this.aiProvider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            system: EXTRACTION_PROMPT,
            messages: [{ role: 'user', content: summaryText }],
          }),
        });

        const result = await response.json() as {
          content: Array<{ text: string }>;
          usage?: { input_tokens: number; output_tokens: number };
        };

        const text = result.content[0]?.text ?? '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch?.[0] ?? '{}') as Record<string, unknown>;
        const tokens = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

        await this.trackUsage(psychologistId, 'session_summary_extraction', tokens, startedAt, 'claude-haiku-4-5-20251001');

        return { data: parsed, tokens };
      } else {
        // OpenAI fallback
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 300,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: EXTRACTION_PROMPT },
              { role: 'user', content: summaryText },
            ],
          }),
        });

        const result = await response.json() as {
          choices: Array<{ message: { content: string } }>;
          usage?: { total_tokens: number };
        };

        const text = result.choices[0]?.message?.content ?? '{}';
        const parsed = JSON.parse(text) as Record<string, unknown>;
        const tokens = result.usage?.total_tokens ?? 0;

        await this.trackUsage(psychologistId, 'session_summary_extraction', tokens, startedAt, 'gpt-4o-mini');

        return { data: parsed, tokens };
      }
    } catch (error) {
      this.logger.error('Phase 3 extraction failed:', error);
      return null;
    }
  }
```

- [ ] **Step 4: Update `trackUsage()` to accept model parameter**

Replace the existing `trackUsage()` method (lines 476-501):

```typescript
  private async trackUsage(
    psychologistId: string,
    feature: string,
    tokens: number,
    startedAt: number,
    model?: string,
  ): Promise<void> {
    const resolvedModel = model ?? (this.aiProvider === 'anthropic' ? 'claude-haiku-4-5' : 'gpt-4o-mini');

    // Approximate cost ($/1M tokens)
    const costMap: Record<string, number> = {
      'claude-sonnet-4-6': 3.0,
      'claude-haiku-4-5-20251001': 0.25,
      'gpt-4o': 2.5,
      'gpt-4o-mini': 0.15,
    };
    const costPer1M = costMap[resolvedModel] ?? 0.25;
    const costUsd = (tokens / 1_000_000) * costPer1M;

    try {
      await this.prisma.aiUsage.create({
        data: {
          psychologistId,
          feature,
          tokensUsed: tokens,
          model: resolvedModel,
          costUsd,
        },
      });
    } catch (e) {
      this.logger.error('Failed to track AI usage:', e);
    }
  }
```

- [ ] **Step 5: Rewrite `streamSessionSummary()` — 3-phase pipeline**

Replace the existing `streamSessionSummary()` method (lines 136-181):

```typescript
  /**
   * Résumé de séance — 3-Phase Pipeline with SSE streaming
   *
   * Phase 1: Collect patient history (no LLM, before SSE headers)
   * Phase 2: Stream narrative summary via Sonnet
   * Phase 3: Extract structured data via Haiku (after stream completes)
   */
  async streamSessionSummary(
    psychologistUserId: string,
    dto: SessionSummaryDto,
    res: Response,
  ): Promise<void> {
    const psy = await this.getPsychologist(psychologistUserId);

    if (!dto.rawNotes || dto.rawNotes.trim().length < 20) {
      throw new BadRequestException('Notes trop courtes pour générer un résumé');
    }

    // Verify GDPR AI consent
    await this.checkAiConsent(dto.sessionId);
    this.requireAiKey();

    // ─── Phase 1: Collect patient history (before SSE headers) ───
    const { dossier, orientation, date, duration } = await this.collectPatientHistory(
      dto.sessionId,
      psy.id,
    );

    // Build the full user message with history context (matches spec format)
    const orientationLabel = orientation ?? 'Non spécifiée';
    const dateStr = date ? date.toISOString().split('T')[0] : 'inconnue';
    const durationStr = duration ? `${duration}` : '?';
    const userMessage = `=== Notes de la séance du ${dateStr} ===
Orientation: ${orientationLabel}
Durée: ${durationStr} min

${dto.rawNotes}

${dossier}`;

    // Get orientation-aware system prompt
    const systemPrompt = getSessionSummaryPrompt(
      orientation as import('@prisma/client').TherapyOrientation | null,
    );

    // ─── SSE headers (set AFTER Phase 1 succeeds) ───
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const startedAt = Date.now();
    let totalTokens = 0;
    let fullSummary = ''; // Accumulate for Phase 3

    try {
      // ─── Phase 2: Stream narrative summary ───
      if (this.aiProvider === 'anthropic') {
        await this.streamSummaryAnthropic(
          userMessage,
          systemPrompt,
          res,
          (tokens) => { totalTokens = tokens; },
          (text) => { fullSummary += text; },
        );
      } else {
        await this.streamSummaryOpenAI(
          userMessage,
          systemPrompt,
          res,
          (tokens) => { totalTokens = tokens; },
          (text) => { fullSummary += text; },
        );
      }

      // Track Phase 2 usage
      const phase2Model = this.aiProvider === 'anthropic' ? 'claude-sonnet-4-6' : 'gpt-4o';
      await this.trackUsage(psy.id, 'session_summary', totalTokens, startedAt, phase2Model);

      // ─── Phase 3: Extract structured data ───
      if (fullSummary.length > 50) {
        const extraction = await this.extractStructuredData(fullSummary, psy.id);
        if (extraction) {
          // Include model name so frontend can save it in aiMetadata
          res.write(`data: ${JSON.stringify({ type: 'structured', data: { ...extraction.data, model: phase2Model } })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ type: 'structured_error' })}\n\n`);
        }
      }

    } catch (error) {
      this.logger.error('AI streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Erreur IA' })}\n\n`);
    } finally {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
```

- [ ] **Step 6: Add `streamSummaryAnthropic()` (Phase 2 with Sonnet + text accumulator)**

Replace the existing `streamWithAnthropic()` method (lines 239-310). Rename it and add the `onText` callback:

```typescript
  private async streamSummaryAnthropic(
    userMessage: string,
    systemPrompt: string,
    res: Response,
    onComplete: (tokens: number) => void,
    onText: (text: string) => void,
  ): Promise<void> {
    const apiKey = this.requireAiKey();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let inputTokens = 0;
    let outputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data) as {
            type: string;
            delta?: { type: string; text?: string };
            usage?: { input_tokens: number; output_tokens: number };
            message?: { usage: { input_tokens: number; output_tokens: number } };
          };

          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const text = parsed.delta.text ?? '';
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
            onText(text);
          }
          if (parsed.type === 'message_start' && parsed.message?.usage) {
            inputTokens = parsed.message.usage.input_tokens;
          }
          if (parsed.type === 'message_delta' && parsed.usage) {
            outputTokens = parsed.usage.output_tokens;
          }
        } catch { /* ignore parse errors */ }
      }
    }

    onComplete(inputTokens + outputTokens);
  }
```

- [ ] **Step 7: Add `streamSummaryOpenAI()` (Phase 2 with gpt-4o + text accumulator)**

Replace the existing `streamWithOpenAI()` method (lines 312-369). Rename it:

```typescript
  private async streamSummaryOpenAI(
    userMessage: string,
    systemPrompt: string,
    res: Response,
    onComplete: (tokens: number) => void,
    onText: (text: string) => void,
  ): Promise<void> {
    const apiKey = this.requireAiKey();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let totalTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') { onComplete(totalTokens); continue; }

        try {
          const parsed = JSON.parse(data) as {
            choices: Array<{ delta?: { content?: string } }>;
            usage?: { total_tokens: number };
          };
          const text = parsed.choices[0]?.delta?.content;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
            onText(text);
          }
          if (parsed.usage) totalTokens = parsed.usage.total_tokens;
        } catch { /* ignore */ }
      }
    }
  }
```

- [ ] **Step 8: Update `streamContent()` to use renamed methods**

The `streamContent()` method (lines 188-237) calls the old `streamWithAnthropic`/`streamWithOpenAI`. The renamed methods now accept `(userMessage, systemPrompt, res, onComplete, onText)`. Replace the **entire try/catch block** inside `streamContent()`:

```typescript
    try {
      if (this.aiProvider === 'anthropic') {
        await this.streamSummaryAnthropic(
          prompt,
          SYSTEM_PROMPTS.content,
          res,
          (tokens) => { totalTokens = tokens; },
          () => {}, // no text accumulation needed for marketing content
        );
      } else {
        await this.streamSummaryOpenAI(
          prompt,
          SYSTEM_PROMPTS.content,
          res,
          (tokens) => { totalTokens = tokens; },
          () => {},
        );
      }
      await this.trackUsage(psy.id, 'marketing_content', totalTokens, startedAt);
    } catch (error) {
      this.logger.error('AI content streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Erreur IA' })}\n\n`);
    } finally {
      res.write('data: [DONE]\n\n');
      res.end();
    }
```

**Note:** Keep `SYSTEM_PROMPTS.content` and `SYSTEM_PROMPTS.exercise` in the file — only `SYSTEM_PROMPTS.sessionSummary` is replaced by the prompt builder. You may remove the `sessionSummary` key from `SYSTEM_PROMPTS` since it's no longer used.

- [ ] **Step 9: Verify EncryptionService is available**

`EncryptionService` is provided by `CommonModule` which is `@Global()` — no changes to `AiModule` needed. The new constructor dependency will be resolved automatically by NestJS DI. Verify with compilation (Step 10).

- [ ] **Step 10: Verify compilation**

Run:
```bash
cd apps/api && npx tsc --noEmit --pretty 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 11: Run existing tests**

Run:
```bash
cd apps/api && npx vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: All existing tests pass (AI tests may need minor adjustments if they mock the renamed methods).

- [ ] **Step 12: Commit**

```bash
git add apps/api/src/ai/ai.service.ts apps/api/src/ai/ai.module.ts
git commit -m "feat(ai): implement 3-phase pipeline — context collection, Sonnet streaming, Haiku extraction"
```

---

### Task 7: Frontend SSE Client — Handle Structured Events

**Files:**
- Modify: `apps/web/src/lib/api/ai.ts`

- [ ] **Step 1: Add `StructuredSummaryData` interface and update callbacks**

Replace the entire `apps/web/src/lib/api/ai.ts` file:

```typescript
/**
 * Client IA PsyLib — streaming SSE vers NestJS /ai/session-summary
 *
 * Format SSE reçu :
 *   data: {"text": "chunk"}\n\n                        (fragments de texte)
 *   data: {"type":"structured","data":{...}}\n\n        (extraction structurée)
 *   data: {"type":"structured_error"}\n\n               (extraction échouée)
 *   data: {"error": "message"}\n\n                      (erreur IA)
 *   data: [DONE]\n\n                                    (fin du stream)
 */

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface StructuredSummaryData {
  tags: string[];
  evolution: 'progress' | 'stable' | 'regression' | 'mixed';
  alertLevel: 'none' | 'low' | 'medium' | 'high';
  alertReason: string | null;
  keyThemes: string[];
  model?: string; // Phase 2 model name (from backend)
}

export interface AiStreamCallbacks {
  onChunk: (text: string) => void;
  onStructuredData?: (data: StructuredSummaryData) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function streamSessionSummary(
  params: { rawNotes: string; context?: string; sessionId: string },
  token: string,
  callbacks: AiStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE}/api/v1/ai/session-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
      signal,
    });
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') return;
    callbacks.onError('Impossible de joindre le serveur IA');
    return;
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({})) as { message?: string };
    callbacks.onError(
      typeof errorBody.message === 'string'
        ? errorBody.message
        : `Erreur ${res.status}`,
    );
    return;
  }

  if (!res.body) {
    callbacks.onError('Streaming non supporté par ce navigateur');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data) as {
            text?: string;
            error?: string;
            type?: string;
            data?: StructuredSummaryData;
          };

          if (parsed.type === 'structured' && parsed.data) {
            callbacks.onStructuredData?.(parsed.data);
          } else if (parsed.type === 'structured_error') {
            // Extraction failed — frontend handles gracefully
          } else if (parsed.error) {
            callbacks.onError(parsed.error);
            return;
          } else if (parsed.text) {
            callbacks.onChunk(parsed.text);
          }
        } catch { /* ignore parse errors on malformed chunks */ }
      }
    }
  } finally {
    reader.releaseLock();
  }

  callbacks.onDone();
}
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/api/ai.ts
git commit -m "feat(ai-client): handle structured SSE events for tags/evolution/alerts"
```

---

### Task 8: session-note-editor.tsx — Save Flow, Tags, Badges

**Files:**
- Modify: `apps/web/src/components/sessions/session-note-editor.tsx`

**Summary of changes:**
- Add new props: `existingSummary`, `existingAiMetadata`, `existingTags`
- Add state for structured data (tags, evolution, alertLevel)
- Wire `onStructuredData` callback
- Add editable tags chips below summary
- Add evolution badge + alert badge
- Add "Sauvegarder le résumé" button → calls `PUT /sessions/:id`
- Add "Régénérer" button (clears state, re-triggers)
- Show existing summary section if `existingSummary` is present
- Show confirmation toast on save

- [ ] **Step 1: Add new imports and types**

Add at top of the file (with existing imports):

```typescript
import type { StructuredSummaryData } from '@/lib/api/ai';
```

Add after the `AiStatus` type:

```typescript
interface AiMetadata {
  evolution?: string;
  alertLevel?: string;
  alertReason?: string | null;
  keyThemes?: string[];
  generatedAt?: string;
  model?: string;
}
```

- [ ] **Step 2: Update props interface**

```typescript
interface SessionNoteEditorProps {
  sessionId: string;
  initialNotes?: string | null;
  existingSummary?: string | null;
  existingAiMetadata?: AiMetadata | null;
  existingTags?: string[];
  onNotesChange?: (notes: string) => void;
  onSummarySaved?: () => void;
  readOnly?: boolean;
}
```

- [ ] **Step 3: Add structured data state**

After the existing AI state declarations (`aiStatus`, `aiSummary`, `aiError`, `copied`, `abortRef`):

```typescript
  // Structured extraction state
  const [structuredData, setStructuredData] = useState<StructuredSummaryData | null>(null);
  const [editableTags, setEditableTags] = useState<string[]>(existingTags ?? []);
  const [newTagInput, setNewTagInput] = useState('');
  const [savingSummary, setSavingSummary] = useState(false);
  const [summaryToast, setSummaryToast] = useState<'saved' | null>(null);
```

- [ ] **Step 4: Wire `onStructuredData` callback in `handleAiSummarize`**

Update the `streamSessionSummary` call in `handleAiSummarize()`:

```typescript
    await streamSessionSummary(
      { rawNotes: getNotesForSave(), sessionId },
      session.accessToken,
      {
        onChunk: (text) => setAiSummary((prev) => prev + text),
        onStructuredData: (data) => {
          setStructuredData(data);
          setEditableTags(data.tags);
        },
        onDone: () => setAiStatus('done'),
        onError: (msg) => {
          setAiError(msg);
          setAiStatus('error');
        },
      },
      abortRef.current.signal,
    );
```

- [ ] **Step 5: Update `handleDismissAi` to clear structured state**

```typescript
  const handleDismissAi = () => {
    abortRef.current?.abort();
    setAiStatus('idle');
    setAiSummary('');
    setAiError('');
    setStructuredData(null);
    setEditableTags([]);
    setNewTagInput('');
  };
```

- [ ] **Step 6: Add tag management handlers**

```typescript
  const handleRemoveTag = (tag: string) => {
    setEditableTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleAddTag = () => {
    const tag = newTagInput.trim().toLowerCase();
    if (tag && !editableTags.includes(tag)) {
      setEditableTags((prev) => [...prev, tag]);
    }
    setNewTagInput('');
  };
```

- [ ] **Step 7: Add save summary handler**

```typescript
  const handleSaveSummary = async () => {
    if (!session?.accessToken || !aiSummary) return;
    setSavingSummary(true);
    try {
      await sessionsApi.update(
        sessionId,
        {
          summaryAi: aiSummary,
          tags: editableTags,
          aiMetadata: {
            evolution: structuredData?.evolution ?? 'stable',
            alertLevel: structuredData?.alertLevel ?? 'none',
            alertReason: structuredData?.alertReason ?? null,
            keyThemes: structuredData?.keyThemes ?? [],
            generatedAt: new Date().toISOString(),
            model: structuredData?.model ?? 'unknown',
          },
        },
        session.accessToken,
      );
      setSummaryToast('saved');
      setTimeout(() => setSummaryToast(null), 3000);
      onSummarySaved?.();
    } catch {
      // Show error inline
      setAiError('Erreur lors de la sauvegarde du résumé');
    } finally {
      setSavingSummary(false);
    }
  };
```

- [ ] **Step 8: Add evolution/alert badge helper components**

Add these helpers above the main component function:

```typescript
function EvolutionBadge({ evolution }: { evolution: string }) {
  const config: Record<string, { label: string; className: string }> = {
    progress: { label: 'Progrès', className: 'bg-green-100 text-green-800 border-green-200' },
    stable: { label: 'Stable', className: 'bg-gray-100 text-gray-700 border-gray-200' },
    regression: { label: 'Régression', className: 'bg-red-100 text-red-800 border-red-200' },
    mixed: { label: 'Mixte', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  };
  const c = config[evolution] ?? config['stable'];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border', c.className)}>
      {c.label}
    </span>
  );
}

function AlertBadge({ level, reason }: { level: string; reason?: string | null }) {
  if (level === 'none') return null;
  const config: Record<string, { className: string }> = {
    low: { className: 'bg-amber-50 text-amber-700 border-amber-200' },
    medium: { className: 'bg-orange-50 text-orange-700 border-orange-200' },
    high: { className: 'bg-red-50 text-red-700 border-red-200' },
  };
  const c = config[level] ?? config['low'];
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border', c.className)}
      title={reason ?? undefined}
    >
      <AlertCircle size={12} aria-hidden />
      Alerte {level === 'high' ? 'élevée' : level === 'medium' ? 'modérée' : 'faible'}
      {reason && ` — ${reason}`}
    </span>
  );
}
```

- [ ] **Step 9: Add structured data UI + save button in the AI result panel**

In the AI result panel (the `{aiStatus === 'done'}` section), after the `<MarkdownBlock>` and before the disclaimer, add:

```tsx
            {/* Tags + badges (after streaming completes) */}
            {aiStatus === 'done' && (structuredData || editableTags.length > 0) && (
              <div className="mt-4 pt-3 border-t border-accent/20 space-y-3">
                {/* Evolution + alert badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {structuredData?.evolution && (
                    <EvolutionBadge evolution={structuredData.evolution} />
                  )}
                  {structuredData?.alertLevel && structuredData.alertLevel !== 'none' && (
                    <AlertBadge level={structuredData.alertLevel} reason={structuredData.alertReason} />
                  )}
                </div>

                {/* Editable tags */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Tags suggérés (modifiables)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {editableTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive transition-colors"
                          aria-label={`Supprimer le tag ${tag}`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <form
                      className="inline-flex"
                      onSubmit={(e) => { e.preventDefault(); handleAddTag(); }}
                    >
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="+ tag"
                        className="w-16 text-xs rounded-full border border-dashed border-border px-2 py-0.5 focus:outline-none focus:border-primary"
                      />
                    </form>
                  </div>
                </div>
              </div>
            )}
```

- [ ] **Step 10: Replace the bottom action bar (Regénérer link) with full action bar**

Replace the existing "Regénérer" button section at the bottom of the AI panel:

```tsx
          {/* Action bar */}
          {aiStatus === 'done' && (
            <div className="px-4 pb-3 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleDismissAi();
                    void handleAiSummarize();
                  }}
                  className="text-xs text-accent hover:underline"
                >
                  Régénérer
                </button>
                <button
                  onClick={handleDismissAi}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Fermer
                </button>
              </div>
              <div className="flex items-center gap-2">
                {summaryToast === 'saved' && (
                  <span className="text-xs text-accent flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Résumé sauvegardé
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={() => void handleSaveSummary()}
                  loading={savingSummary}
                  disabled={savingSummary || !aiSummary}
                >
                  <Save size={14} />
                  Sauvegarder le résumé
                </Button>
              </div>
            </div>
          )}
```

- [ ] **Step 11: Add existing summary section (when `existingSummary` is present)**

Add a new section **before** the AI button, showing the previously saved summary:

```tsx
      {/* Résumé IA précédent (si existant) */}
      {!readOnly && existingSummary && aiStatus === 'idle' && (
        <details className="rounded-xl border border-border bg-white shadow-sm group">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-medium text-foreground hover:bg-surface/50 rounded-xl">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-accent" aria-hidden />
              <span>Résumé IA sauvegardé</span>
              {existingAiMetadata?.evolution && (
                <EvolutionBadge evolution={existingAiMetadata.evolution} />
              )}
              {existingAiMetadata?.alertLevel && existingAiMetadata.alertLevel !== 'none' && (
                <AlertBadge level={existingAiMetadata.alertLevel} reason={existingAiMetadata.alertReason} />
              )}
            </div>
          </summary>
          <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
            <MarkdownBlock content={existingSummary} />
            {existingTags && existingTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {existingTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {existingAiMetadata?.generatedAt && (
              <p className="text-xs text-muted-foreground">
                Généré le {new Date(existingAiMetadata.generatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <button
              onClick={() => {
                handleDismissAi();
                void handleAiSummarize();
              }}
              className="text-xs text-accent hover:underline"
            >
              Régénérer un nouveau résumé
            </button>
          </div>
        </details>
      )}
```

- [ ] **Step 12: Verify compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 13: Commit**

```bash
git add apps/web/src/components/sessions/session-note-editor.tsx
git commit -m "feat(editor): add AI summary save flow, editable tags, evolution/alert badges"
```

---

### Task 9: session-detail.tsx — Pass Summary Props to Editor

**Files:**
- Modify: `apps/web/src/components/sessions/session-detail.tsx:228-233`

**Depends on:** Task 4 (shared types update) — `session.aiMetadata` must be in the `Session` type.

- [ ] **Step 1: Pass existing summary data to `SessionNoteEditor`**

Replace the `<SessionNoteEditor>` usage (around line 229-232):

```tsx
        <SessionNoteEditor
          sessionId={sessionId}
          initialNotes={session.notes}
          existingSummary={session.summaryAi}
          existingAiMetadata={session.aiMetadata as AiMetadata | null}
          existingTags={session.tags}
          onSummarySaved={() => {
            void queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
          }}
        />
```

Note: `AiMetadata` is the interface defined in `session-note-editor.tsx` (Task 8, Step 1). Import it or use inline type cast. The `session.aiMetadata` field is typed as `Record<string, unknown> | null` from `@psyscale/shared-types` which is compatible.

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sessions/session-detail.tsx
git commit -m "feat(session-detail): pass summary/metadata/tags props to note editor"
```

---

### Task 10: Integration Test — Full Pipeline Smoke Test

**Files:**
- Run: Manual/automated test of the full flow

- [ ] **Step 1: Verify backend compiles and starts**

Run:
```bash
cd apps/api && npx tsc --noEmit --pretty 2>&1 | tail -5
```

Expected: No errors.

- [ ] **Step 2: Run all backend tests**

Run:
```bash
cd apps/api && npx vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: All tests pass. If AI service tests mock `streamWithAnthropic`/`streamWithOpenAI`, update mock names to `streamSummaryAnthropic`/`streamSummaryOpenAI` and add the `onText` callback parameter. If tests instantiate `AiService` directly, add `EncryptionService` mock (already globally provided, but test modules may need explicit mock).

- [ ] **Step 3: Verify frontend compiles**

Run:
```bash
cd apps/web && npx tsc --noEmit --pretty 2>&1 | tail -5
```

Expected: No errors.

- [ ] **Step 4: Build frontend to check for runtime issues**

Run:
```bash
cd apps/web && npx next build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 5: Commit any test fixes**

If any tests needed adjustment:
```bash
git add -A
git commit -m "fix(tests): update AI service test mocks for renamed streaming methods"
```

---

### Task 11: Verify findAll Exclusion of aiMetadata

**Files:**
- Verify: `apps/api/src/sessions/sessions.service.ts:100-123` (findAll select)

- [ ] **Step 1: Check that `findAll()` does NOT return `aiMetadata` in list view**

Look at the `select` in `findAll()` (around line 106). Currently it selects specific fields. Since it uses `select: { ... }`, only listed fields are returned. `aiMetadata` is NOT listed → it's excluded by default. Verify this is correct.

If `aiMetadata` IS in the select, remove it (list views should not return metadata).

- [ ] **Step 2: Commit if changes were needed**

```bash
git add apps/api/src/sessions/sessions.service.ts
git commit -m "fix(sessions): ensure aiMetadata excluded from list endpoint"
```

(Skip if no changes needed.)
