# AI Session Summary — Agent Contextuel — Design Spec

**Date:** 2026-04-06
**Status:** Approved
**Scope:** Upgrade the existing AI session summary from a basic one-shot generation to a contextual agent that reads patient history, adapts by therapy orientation, extracts structured data, and persists results.

---

## Context

The AI session summary feature already exists and is functional:
- **Backend:** `ai.service.ts` (552 lines) — streaming SSE, Anthropic/OpenAI, consent checks, rate limiting, usage tracking
- **Frontend:** `session-note-editor.tsx` (702 lines) — "Résumer" button, streaming display, markdown rendering, copy, abort
- **Client:** `lib/api/ai.ts` — SSE parser with callbacks

**What's missing:**
1. No patient history context (each summary is isolated)
2. Basic prompt (generic, not orientation-aware)
3. No structured data extraction (tags, evolution, alerts)
4. Summaries are not saved to database (`summaryAi` field unused)
5. No way to view past summaries on session detail page

**What this spec adds:**
1. Patient history aggregation (last 15 sessions)
2. Orientation-aware prompts (TCC, Psychodynamique, Systémique, ACT)
3. Structured extraction via 2nd LLM call (tags, evolution, alerts)
4. Explicit save with editable tags
5. Summary display on session detail page

---

## Architecture: 3-Phase Pipeline

### Phase 1 — Context Collection (no LLM)

Backend collects patient history before calling the LLM:

1. Fetch last 15 sessions for the patient, ordered by date DESC
2. For each past session:
   - Use `summaryAi` if available (compact, ~200 words)
   - Otherwise, truncate decrypted `notes` to 500 characters
   - Include: date, duration, orientation, tags, mood (if tracked)
3. Build a structured "patient dossier" string:
   ```
   === Historique patient (15 dernières séances) ===

   [2026-04-01] Séance 50min (TCC) — Humeur: 3/5
   Tags: anxiété, travail
   Résumé: [summaryAi or truncated notes]

   [2026-03-25] Séance 50min (TCC) — Humeur: 2/5
   Tags: insomnie, rumination
   Résumé: [...]
   ```
4. Decrypt notes server-side only — never send encrypted data or raw notes of past sessions to frontend

**Token budget for history:** ~2000 tokens max (15 sessions × ~130 tokens each). Combined with current session notes (~500 tokens) and system prompt (~500 tokens), total input stays under 4000 tokens.

### Phase 2 — Contextual Narrative Summary (Sonnet streaming)

Single LLM call with enriched context:

- **Model:** `claude-sonnet-4-6` (needs reasoning about evolution across sessions)
- **Max tokens output:** 2000
- **Streaming:** SSE to frontend (same infrastructure as current)
- **System prompt:** Orientation-specific (see Prompts section below)
- **User message:**
  ```
  === Notes de la séance du [date] ===
  Orientation: [TCC/Psychodynamique/Systémique/ACT]
  Durée: [duration] min

  [current session notes - full, decrypted]

  === Historique patient ===
  [patient dossier from Phase 1]
  ```

### Phase 3 — Structured Extraction (Haiku JSON)

Triggered automatically after streaming completes:

- **Model:** `claude-haiku-4-5-20251001` (fast, cheap, good at extraction)
- **Input:** The narrative summary just generated (Phase 2 output)
- **Max tokens output:** 300
- **Mode:** JSON (not streaming)
- **Output schema:**
  ```json
  {
    "tags": ["anxiété", "travail", "insomnie"],
    "evolution": "progress" | "stable" | "regression" | "mixed",
    "alertLevel": "none" | "low" | "medium" | "high",
    "alertReason": "string or null",
    "keyThemes": ["gestion du stress", "restructuration cognitive"]
  }
  ```
- **Sent to frontend** as a final SSE event: `data: {"type": "structured", "data": {...}}`
- **Cost:** ~$0.003 per call (negligible)

### SSE Event Flow

```
Frontend                          Backend
   |--- POST /ai/session-summary --->|
   |                                  | Phase 1: collect history
   |                                  | Phase 2: call Sonnet streaming
   |<-- data: {"chunk": "## Résu"} --|
   |<-- data: {"chunk": "mé de"} ----|
   |<-- ...                        ---|
   |<-- data: {"chunk": "...fin"} ---|
   |                                  | Phase 3: call Haiku JSON
   |<-- data: {"type":"structured",---|
   |     "data":{"tags":[...],...}} --|
   |<-- data: [DONE]              ---|
```

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
Cite des éléments concrets de l'historique.]

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

### Extraction Prompt (Phase 3 — Haiku)

```
Extrais les données structurées du résumé de séance ci-dessous.

Réponds UNIQUEMENT en JSON valide, sans texte autour :
{
  "tags": ["liste de 3-7 tags cliniques courts"],
  "evolution": "progress" | "stable" | "regression" | "mixed",
  "alertLevel": "none" | "low" | "medium" | "high",
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
   - **"Sauvegarder le résumé"** button + **"Régénérer"** button

2. On save click → `PATCH /sessions/:id` with:
   ```json
   {
     "summaryAi": "markdown string",
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

3. Backend encrypts `summaryAi` with AES-256-GCM before storage
4. Audit log: `action: "AI_SUMMARY_SAVE"`, `entity_type: "session"`

### Database Changes

**Modify `Session` model in Prisma:**
```prisma
model Session {
  // ... existing fields ...
  aiMetadata  Json?    // Evolution, alerts, themes, generation metadata
}
```

**Migration:** Add nullable `aiMetadata` JSON column to `sessions` table.

No changes to `summaryAi` (already exists, String?, encrypted) or `tags` (already exists, String[]).

---

## Frontend Changes

### session-note-editor.tsx — Modifications

**Current behavior:** Generate → display markdown → copy button → dismiss.

**New behavior:**
1. Generate → display streaming markdown
2. After `[DONE]`, receive `structured_data` event → display:
   - Tags as editable chips (below summary)
   - Evolution badge
   - Alert badge (if applicable)
3. Show action bar: "Sauvegarder le résumé" + "Régénérer" + "Fermer"
4. On save: call `PATCH /sessions/:id` with summary + edited tags + aiMetadata
5. Show confirmation toast "Résumé sauvegardé"

**If `summaryAi` already exists in session data:**
- Show collapsible "Résumé IA précédent" section with saved markdown
- "Régénérer" button replaces the save flow
- Previous tags visible as reference

### session-detail.tsx — Modifications

**Add "Résumé IA" section** (only if `summaryAi` is populated):
- Collapsible card with markdown rendering
- Tags displayed as badges
- Evolution badge + alert badge
- "Généré le [date]" metadata
- "Régénérer" button → navigates to note editor or opens inline

### lib/api/ai.ts — Modifications

**Update `streamSessionSummary()`:**
- Add `onStructuredData(data: StructuredSummaryData)` callback
- Parse `{"type": "structured", ...}` SSE events separately from text chunks
- Type definition for `StructuredSummaryData`

---

## Backend Changes

### ai.service.ts — Modifications

**`streamSessionSummary()` method — rewrite:**
1. Add Phase 1: `collectPatientHistory(sessionId)` private method
   - Fetch last 15 sessions for same patient
   - Decrypt `summaryAi` or `notes` for each
   - Build dossier string
2. Update Phase 2: use orientation-specific prompt + patient dossier
   - Switch model from `claude-haiku-4-5-20251001` to `claude-sonnet-4-6`
   - Include dossier in user message
3. Add Phase 3: after streaming completes, call `extractStructuredData(summaryText)`
   - New private method using Haiku JSON mode
   - Send result as `{"type": "structured", "data": {...}}` SSE event before `[DONE]`

**New `SessionSummaryDto` fields:**
- No changes needed — `sessionId` already provided, used to look up patient + history

**Prompt storage:** Move prompts from inline `SYSTEM_PROMPTS` constant to a new file `apps/api/src/ai/prompts/session-summary.prompts.ts` for maintainability. Export `getSessionSummaryPrompt(orientation: TherapyOrientation)` function.

### sessions.service.ts — Modifications

**`update()` method:**
- Accept `summaryAi`, `tags`, `aiMetadata` in update DTO
- Encrypt `summaryAi` before storage (already does this for notes)
- Add audit log entry for AI summary save

### sessions.controller.ts — No changes needed

The existing `PUT /:id` endpoint already accepts partial updates. The DTO just needs the new `aiMetadata` field added.

---

## Security & Compliance

- **Consent:** Existing `checkAiConsent()` already verifies GDPR ai_processing consent — no changes needed
- **Encryption:** `summaryAi` encrypted AES-256-GCM before storage (existing pattern)
- **Audit:** AI_SUMMARY_SAVE action logged with actor, entity, timestamp
- **Past session notes:** Decrypted server-side only, never sent to frontend, only sent to LLM after consent check
- **Rate limiting:** Keep existing 5 req/min per psychologist
- **Token tracking:** Track both Phase 2 (Sonnet) and Phase 3 (Haiku) in `ai_usage` table

---

## Error Handling

- **No patient history:** Works fine — prompt handles "historique insuffisant" gracefully
- **Phase 2 streaming fails mid-way:** Frontend shows partial summary + error banner. No save possible.
- **Phase 3 extraction fails:** Frontend shows summary without structured data. Save still possible (tags empty, no evolution badge). Retry Phase 3 only.
- **No AI key configured:** Existing error handling (BadRequestException)
- **No GDPR consent:** Existing error handling (ForbiddenException)
- **Session notes too short (<20 chars):** Existing validation

---

## Out of Scope

- Cross-patient pattern detection (would require breaking tenant isolation)
- Automatic alert notifications (alertLevel triggers no side effects — display only)
- AI-generated treatment plans beyond per-session suggestions
- Voice-to-text note taking
- Multi-language support (French only)
- Automatic summaryAi save (always explicit user action)
