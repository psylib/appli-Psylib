# AI Session Summary — Agent Contextuel — Design Spec

**Date:** 2026-04-06
**Status:** Approved
**Scope:** Upgrade the existing AI session summary from a basic one-shot generation to a contextual agent that reads patient history, adapts by therapy orientation, extracts structured data, and persists results.

---

## Context

The AI session summary feature already exists and is functional:
- **Backend:** `ai.service.ts` (552 lines) — streaming SSE, Anthropic/OpenAI, consent checks, rate limiting, usage tracking
- **Frontend:** `session-note-editor.tsx` (702 lines) — "Résumer" button, streaming display, markdown rendering, copy, abort
- **Client:** `lib/api/ai.ts` — SSE parser with callbacks (uses `{ text: string }` field for streaming chunks)

**What's missing:**
1. No patient history context (each summary is isolated)
2. Basic prompt (generic, not orientation-aware)
3. No structured data extraction (tags, evolution, alerts)
4. Summaries are not saved to database (`summaryAi` field unused)
5. No way to view past summaries on session detail page

**What this spec adds:**
1. Patient history aggregation (last 15 sessions)
2. Orientation-aware prompts (TCC, Psychodynamique, Systémique, ACT, fallback for AUTRE)
3. Structured extraction via 2nd LLM call (tags, evolution, alerts)
4. Explicit save with editable tags
5. Summary display on session detail page (`apps/web/src/components/sessions/session-detail.tsx` — existing file, 249 lines)

**Existing files touched:**
- `apps/api/src/ai/ai.service.ts` — major modifications (3-phase pipeline)
- `apps/api/src/sessions/dto/session.dto.ts` — add `summaryAi` + `aiMetadata` to `UpdateSessionDto`
- `apps/api/src/sessions/sessions.service.ts` — encrypt `summaryAi` on save, audit log
- `apps/web/src/lib/api/ai.ts` — handle `structured` SSE event type
- `apps/web/src/components/sessions/session-note-editor.tsx` — save flow, tags chips, badges
- `apps/web/src/components/sessions/session-detail.tsx` — display saved summary

**New files:**
- `apps/api/src/ai/prompts/session-summary.prompts.ts` — orientation-aware prompt builder
- `apps/api/prisma/migrations/YYYYMMDD_add_ai_metadata/` — add `aiMetadata` column

**Backend:** No new endpoints. Uses existing `POST /ai/session-summary` (streaming) + existing `PUT /sessions/:id` (save).

---

## Architecture: 3-Phase Pipeline

### Phase 1 — Context Collection (no LLM, before SSE headers)

Backend collects patient history **before** setting SSE response headers. This allows returning a proper HTTP error if the DB query fails.

1. Fetch the current session to get `patientId` and `psychologistId`
2. Fetch last 15 sessions for the same patient **filtered by `psychologistId`** (tenant isolation), ordered by date DESC, excluding the current session
3. For each past session:
   - Use decrypted `summaryAi` if available (compact, ~200 words)
   - Otherwise, truncate decrypted `notes` to 500 characters
   - Include: date, duration, orientation, tags
4. Build a structured "patient dossier" string:
   ```
   === Historique patient (15 dernières séances) ===

   [2026-04-01] Séance 50min (TCC)
   Tags: anxiété, travail
   Résumé: [summaryAi or truncated notes]

   [2026-03-25] Séance 50min (TCC)
   Tags: insomnie, rumination
   Résumé: [...]
   ```
5. All decryption happens server-side — past session notes/summaries never sent to frontend

**Error handling:** If Phase 1 DB query fails, return HTTP 500 (no SSE headers sent yet). If decryption fails for a specific past session, skip it silently (partial history is acceptable).

**Token budget for history:** ~2000 tokens max (15 sessions × ~130 tokens each). Combined with current session notes (~500 tokens) and system prompt (~500 tokens), total input stays under 4000 tokens.

### Phase 2 — Contextual Narrative Summary (Sonnet streaming)

SSE response headers are set **after** Phase 1 completes successfully.

Single LLM call with enriched context:

- **Model:** `claude-sonnet-4-6` (needs reasoning about evolution across sessions)
- **Fallback (OpenAI):** `gpt-4o` (comparable reasoning capability)
- **Max tokens output:** 2000
- **Streaming:** SSE to frontend (same infrastructure as current)
- **System prompt:** Orientation-specific (see Prompts section below)
- **User message:**
  ```
  === Notes de la séance du [date] ===
  Orientation: [TCC/Psychodynamique/Systémique/ACT/Autre]
  Durée: [duration] min

  [current session notes - full, from rawNotes parameter sent by frontend]

  === Historique patient ===
  [patient dossier from Phase 1, or "Aucun historique disponible" if empty]
  ```

> **Note on `rawNotes` parameter:** The frontend still sends `rawNotes` in the request body (the current editor content, possibly unsaved). This is intentional — the backend uses `rawNotes` for the current session's notes (which may differ from the last saved version in DB) and fetches only past sessions from the database. The `rawNotes` field stays required in `SessionSummaryDto`.

### Phase 3 — Structured Extraction (Haiku JSON)

Triggered automatically after streaming completes:

- **Model (Anthropic):** `claude-haiku-4-5-20251001` (fast, cheap, good at extraction)
- **Model (OpenAI fallback):** `gpt-4o-mini` (equivalent: fast, cheap, JSON mode)
- **Input:** The narrative summary just generated (Phase 2 output, accumulated server-side)
- **Max tokens output:** 300
- **Mode:** JSON (not streaming)
- **Output schema:**
  ```json
  {
    "tags": ["anxiété", "travail", "insomnie"],
    "evolution": "progress | stable | regression | mixed",
    "alertLevel": "none | low | medium | high",
    "alertReason": "string or null",
    "keyThemes": ["gestion du stress", "restructuration cognitive"]
  }
  ```
- **Sent to frontend** as a final SSE event with distinct type field: `data: {"type": "structured", "data": {...}}`
- **If Phase 3 fails:** Send `data: {"type": "structured_error"}` — frontend shows summary without tags/badges. Save is still possible with empty tags.
- **Cost:** ~$0.003 per call (negligible)

### SSE Event Flow

The existing SSE protocol uses `{ text: string }` for streaming chunks. This spec **preserves** that field name for backward compatibility and adds a new `type`-discriminated event for structured data.

```
Frontend                          Backend
   |--- POST /ai/session-summary --->|
   |                                  | Phase 1: collect history (no SSE yet)
   |                                  | Set SSE headers
   |                                  | Phase 2: call Sonnet streaming
   |<-- data: {"text": "## Résu"} ---|
   |<-- data: {"text": "mé de"}  ---|
   |<-- ...                        ---|
   |<-- data: {"text": "...fin"}  ---|
   |                                  | Phase 3: call Haiku JSON
   |<-- data: {"type":"structured",---|
   |     "data":{"tags":[...],...}} --|
   |<-- data: [DONE]              ---|
```

**Client parser update (`lib/api/ai.ts`):**
```typescript
const parsed = JSON.parse(data);
if (parsed.type === 'structured') {
  callbacks.onStructuredData?.(parsed.data);
} else if (parsed.text) {
  callbacks.onChunk(parsed.text);
} else if (parsed.error) {
  callbacks.onError(parsed.error);
}
```

### Token Tracking

Two separate `ai_usage` rows per summary request:
1. Phase 2: `feature: 'session_summary'`, `model: 'claude-sonnet-4-6'` (or `gpt-4o`)
2. Phase 3: `feature: 'session_summary_extraction'`, `model: 'claude-haiku-4-5-20251001'` (or `gpt-4o-mini`)

The existing `trackUsage()` method must accept the model name as a parameter instead of hardcoding it.

---

## Prompts by Orientation

### Base Structure (all orientations)

```
Tu es un assistant clinique pour psychologues. Tu as accès à l'historique du patient.

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
- Utilise un langage clinique professionnel mais accessible
```

### TCC Addition
```
ORIENTATION TCC :
- Identifie les pensées automatiques et schémas cognitifs mentionnés
- Note les comportements cibles et leur évolution
- Évalue l'avancement des exercices entre séances (exposition, restructuration cognitive)
- Utilise le vocabulaire TCC : schéma, pensée automatique, distorsion cognitive, renforcement
```

### Psychodynamique Addition
```
ORIENTATION PSYCHODYNAMIQUE :
- Repère les éléments de transfert et contre-transfert
- Identifie les mécanismes de défense observés
- Note les associations libres significatives
- Évalue l'évolution de l'alliance thérapeutique
- Utilise le vocabulaire analytique : transfert, résistance, acting out, insight
```

### Systémique Addition
```
ORIENTATION SYSTÉMIQUE :
- Identifie les patterns relationnels et interactions familiales
- Note les changements dans le contexte systémique
- Repère les alliances, coalitions et triangulations
- Évalue les effets des prescriptions paradoxales ou recadrages
- Utilise le vocabulaire systémique : homéostasie, circularité, double lien
```

### ACT Addition
```
ORIENTATION ACT :
- Évalue la flexibilité psychologique du patient
- Identifie les comportements d'évitement expérientiel
- Note le travail sur les valeurs et l'engagement
- Repère les exercices de défusion cognitive et pleine conscience
- Utilise le vocabulaire ACT : fusion, défusion, acceptation, valeurs, soi-contexte
```

### AUTRE / No orientation
When `orientation` is `AUTRE` or `null`, use the base structure only — no orientation-specific addition appended.

### Extraction Prompt (Phase 3 — Haiku)

```
Extrais les données structurées du résumé de séance ci-dessous.

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
- Tags en français, tout en minuscules
```

---

## Persistence

### Save Flow

After AI generation completes and the psychologist reviews:

1. Frontend displays:
   - Markdown summary (read-only)
   - Suggested tags as editable chips (can remove/add before save)
   - Evolution badge: 🟢 Progrès / 🟡 Stable / 🔴 Régression / ⚪ Mixte
   - Alert badge (if alertLevel > none): ⚠️ with reason
   - **"Sauvegarder le résumé"** button + **"Régénérer"** button + **"Fermer"** button

2. On save click → `PUT /sessions/:id` with:
   ```json
   {
     "summaryAi": "markdown string (plaintext, NOT pre-encrypted)",
     "tags": ["edited", "tag", "list"],
     "aiMetadata": {
       "evolution": "progress",
       "alertLevel": "none",
       "alertReason": null,
       "keyThemes": ["..."],
       "generatedAt": "2026-04-06T14:30:00Z",
       "model": "claude-sonnet-4-6"
     }
   }
   ```

   > **Important:** `summaryAi` in the request body is plaintext markdown. The backend encrypts it with AES-256-GCM before writing to the database (same pattern as `notes`). There is no double-encryption risk — the `update()` method receives plaintext and encrypts once.

3. Audit log: `action: "AI_SUMMARY_SAVE"`, `entity_type: "session"`

### Clicking "Régénérer"

When the psychologist clicks "Régénérer" (whether from a fresh generation or over an existing saved summary):
1. Clear all AI state: `aiSummary = ''`, `structuredData = null`, `aiStatus = 'idle'`
2. Remove tags chips and badges from display
3. Trigger a new generation (same as clicking "Résumer" for the first time)
4. The new result replaces the previous one in the UI. Saving overwrites the DB values.

### Database Changes

**Modify `Session` model in Prisma:**
```prisma
model Session {
  // ... existing fields ...
  aiMetadata  Json?    // Evolution, alerts, themes, generation metadata
}
```

**Migration:** Add nullable `aiMetadata` JSON column to `sessions` table.

**Modify `UpdateSessionDto`** in `apps/api/src/sessions/dto/session.dto.ts`:
```typescript
@ApiPropertyOptional()
@IsString()
@IsOptional()
@MaxLength(100000)
summaryAi?: string;

@ApiPropertyOptional()
@IsOptional()
@IsObject()
aiMetadata?: Record<string, unknown>;
```

**Modify `sessions.service.ts` `update()` method:**
- If `dto.summaryAi` is present, encrypt it with `EncryptionService.encrypt()` before writing
- Pass `aiMetadata` through to Prisma (JSON field, no encryption needed — contains no patient data, only metadata about the AI generation)
- Add audit log entry with `action: 'AI_SUMMARY_SAVE'` when `summaryAi` is present in the update

No changes to `summaryAi` (already exists, String?, encrypted) or `tags` (already exists, String[]).

---

## Frontend Changes

### session-note-editor.tsx — Modifications

**Current behavior:** Generate → display markdown → copy button → dismiss.

**New behavior:**
1. Generate → display streaming markdown (same as current)
2. After streaming completes, receive `structured` event → display:
   - Tags as editable chips (below summary, using shadcn Badge component)
   - Evolution badge (colored dot + label)
   - Alert badge (if alertLevel > none, amber/red warning with reason)
3. Show action bar: "Sauvegarder le résumé" + "Régénérer" + "Fermer"
4. On save: call `PUT /sessions/:id` via `sessionsApi.update()` with summary + edited tags + aiMetadata
5. Show confirmation toast "Résumé sauvegardé"

**If `summaryAi` already exists in session data (passed as prop):**
- Show collapsible "Résumé IA précédent" section with saved markdown + tags + badges
- "Régénérer" button available → clears state, starts fresh generation

**New props needed:** `existingSummary?: string`, `existingAiMetadata?: AiMetadata`, `existingTags?: string[]`

### session-detail.tsx — Modifications

**File:** `apps/web/src/components/sessions/session-detail.tsx` (existing, 249 lines)

**Add "Résumé IA" section** (only if `summaryAi` is populated):
- Collapsible card with markdown rendering (reuse `MarkdownBlock` from note editor)
- Tags displayed as `Badge` components
- Evolution badge + alert badge
- "Généré le [date]" metadata from `aiMetadata.generatedAt`
- "Régénérer" button → navigates to note editor view

### lib/api/ai.ts — Modifications

**Update `streamSessionSummary()` callback interface:**
```typescript
interface StreamCallbacks {
  onChunk: (text: string) => void;
  onStructuredData?: (data: StructuredSummaryData) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

interface StructuredSummaryData {
  tags: string[];
  evolution: 'progress' | 'stable' | 'regression' | 'mixed';
  alertLevel: 'none' | 'low' | 'medium' | 'high';
  alertReason: string | null;
  keyThemes: string[];
}
```

**Update SSE parser** to handle type-discriminated events (see SSE Event Flow section above).

---

## Backend Changes

### ai.service.ts — Modifications

**`streamSessionSummary()` method — rewrite:**

1. **Phase 1:** Call `collectPatientHistory(sessionId, psychologistId)` private method
   - Query: `prisma.session.findMany({ where: { patientId, psychologistId, id: { not: sessionId } }, orderBy: { date: 'desc' }, take: 15, select: { date, duration, orientation, tags, notes, summaryAi } })`
   - Decrypt `summaryAi` or `notes` for each session using `EncryptionService`
   - Build dossier string
   - **This runs BEFORE SSE headers are sent** — errors return HTTP 500

2. **Set SSE headers** (moved after Phase 1)

3. **Phase 2:** Use orientation-specific prompt + patient dossier
   - Get orientation from current session (`prisma.session.findUnique`)
   - Call `getSessionSummaryPrompt(orientation)` from prompts file
   - Accumulate full text server-side in a buffer (needed for Phase 3 input)
   - Model: `claude-sonnet-4-6` (Anthropic) or `gpt-4o` (OpenAI)
   - Track usage: `trackUsage(psyId, 'session_summary', tokens, startedAt, 'claude-sonnet-4-6')`

4. **Phase 3:** Call `extractStructuredData(summaryText)` private method
   - Model: `claude-haiku-4-5-20251001` (Anthropic) or `gpt-4o-mini` (OpenAI)
   - Parse JSON response, validate against expected schema
   - Send as `{"type": "structured", "data": {...}}` SSE event
   - On failure: send `{"type": "structured_error"}` and log warning
   - Track usage: `trackUsage(psyId, 'session_summary_extraction', tokens, startedAt, 'claude-haiku-4-5-20251001')`

**`trackUsage()` method update:** Add `model: string` parameter instead of hardcoding model name.

**New `SessionSummaryDto` fields:** No changes — `rawNotes` stays required (frontend sends current editor content), `sessionId` used to look up patient + history.

**Prompt storage:** Move prompts from inline `SYSTEM_PROMPTS` constant to a new file `apps/api/src/ai/prompts/session-summary.prompts.ts`. Export `getSessionSummaryPrompt(orientation: TherapyOrientation | null)` function that returns base prompt + orientation addition.

### sessions.service.ts — Modifications

**`update()` method:**
- Accept `summaryAi` and `aiMetadata` from updated `UpdateSessionDto`
- Encrypt `summaryAi` with `EncryptionService.encrypt()` before Prisma write (same pattern as `notes`)
- `aiMetadata` is NOT encrypted (contains no patient data — only model name, timestamps, evolution label)
- Add audit log entry for AI summary save: `action: 'AI_SUMMARY_SAVE'`

**`findOne()` method:**
- Already decrypts `summaryAi` — no changes needed
- Return `aiMetadata` as-is (JSON, no decryption)

### sessions.controller.ts — No endpoint changes

The existing `PUT /:id` endpoint handles the update. The `UpdateSessionDto` changes (adding `summaryAi` + `aiMetadata`) are sufficient.

---

## Security & Compliance

- **Consent:** Existing `checkAiConsent()` already verifies GDPR ai_processing consent — no changes needed
- **Encryption:** `summaryAi` is plaintext in request body, encrypted AES-256-GCM by backend before DB write. Decrypted on read by `findOne()`. No double-encryption.
- **Tenant isolation:** `collectPatientHistory()` always filters by `psychologistId` — mandatory
- **Audit:** AI_SUMMARY_SAVE action logged with actor, entity, timestamp
- **Past session notes:** Decrypted server-side only, never sent to frontend, only sent to LLM after consent check
- **Rate limiting:** Keep existing 5 req/min per psychologist
- **Token tracking:** Two separate `ai_usage` rows per summary (Phase 2 + Phase 3), with correct model names

---

## Error Handling

- **Phase 1 DB failure:** HTTP 500 returned (SSE headers not yet sent)
- **Phase 1 decryption failure for past session:** Skip that session, continue with partial history
- **No patient history (first session):** Works fine — prompt says "Première séance enregistrée"
- **Phase 2 streaming fails mid-way:** Frontend shows partial summary + error banner. No save possible.
- **Phase 3 extraction fails:** Send `{"type": "structured_error"}` SSE event. Frontend shows summary without tags/badges. Save still possible (tags default to empty, no evolution badge).
- **Phase 3 returns invalid JSON:** Same as failure — parse error caught, structured_error sent
- **No AI key configured:** Existing error handling (BadRequestException)
- **No GDPR consent:** Existing error handling (ForbiddenException)
- **Session notes too short (<20 chars):** Existing validation on `rawNotes`

---

## Out of Scope

- Cross-patient pattern detection (would require breaking tenant isolation)
- Automatic alert notifications (alertLevel triggers no side effects — display only)
- AI-generated treatment plans beyond per-session suggestions
- Voice-to-text note taking
- Multi-language support (French only)
- Automatic summaryAi save (always explicit user action)
- Vercel AI SDK `useChat` hook (existing SSE implementation is simpler and already works)
