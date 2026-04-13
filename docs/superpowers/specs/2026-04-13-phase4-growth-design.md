# Phase 4 — Growth Features Design Spec

**Date:** 2026-04-13
**Scope:** Analytics Polish + Marketing IA Frontend + Course Builder Frontend + Plan Enforcement

---

## 1. Analytics Dashboard — POLISH ONLY

### Backend (existing, complete)
- `GET /analytics/overview` — KPIs
- `GET /analytics/revenue/:months` — Revenue trend
- `GET /analytics/patients/:months` — Patient growth
- `GET /analytics/mood-trends` — Mood averages

### Frontend (existing, mostly complete)
`analytics-content.tsx` already implements:
- 4 KPI cards (revenue, active patients, sessions, portal adoption) with trend deltas
- Bar chart (revenue by month) — custom SVG
- Line chart (patient growth) — custom SVG with area gradient
- Mood trend bars (weekly, color-coded)
- Summary grid
- Skeleton loaders
- `useQuery` data fetching with token auth

**Gating:** `analytics-gated.tsx` wraps with `FeatureLock requiredPlan="pro"` — done.

### What remains
- Verify page works end-to-end with real API data
- Fix any visual bugs or responsive issues
- Add period filter toggle (6/12 months) if missing

---

## 2. Marketing IA (Content Generator) — FRONTEND ONLY

### Backend (existing, complete)
Already implemented in `ai.controller.ts` + `ai.service.ts`:
- `POST /ai/stream-content` — SSE streaming (type: linkedin|newsletter|blog, theme, tone)
- `POST /ai/content-library` — Save generated content
- `GET /ai/content-library` — List saved contents (50 max, ordered by date)
- `DELETE /ai/content-library/:id` — Delete content
- Rate limit: 10 req/min
- OpenRouter integration with type-specific prompts
- Usage tracking via `aiUsage` table
- Guards: KeycloakGuard + RolesGuard (psychologist only)

### Frontend (to build)
- **Page:** `apps/web/src/app/(dashboard)/dashboard/marketing/page.tsx`
- **Layout:**
  - Top: Type selector (3 cards: LinkedIn, Newsletter, Blog) with icons
  - Form: Theme textarea + tone select (professional|warm|educational, default: professional)
  - Generate button → streaming output area with copy button
  - Below: History list (saved contents) with type badge, date, preview, delete
- **Gating:** Pro + Scale plans (via FeatureLock)
- **Components:**
  - `marketing-gated.tsx` — Plan check wrapper
  - `marketing-page-content.tsx` — Main page layout
  - `content-generator-form.tsx` — Type/theme/tone form
  - `content-stream-viewer.tsx` — SSE streaming display + copy + save
  - `content-history-list.tsx` — List of saved contents

### Streaming flow
```
Form submit → POST /ai/stream-content (SSE)
  → EventSource reads chunks → progressive text display
  → On [DONE]: enable copy/save buttons → POST /ai/content-library
  → Invalidate content-library query → refresh history
```

### SSE pattern
Reuse same pattern as session summary streaming (already works in AI assistant page).

---

## 3. Course Builder (Formations) — FRONTEND + MINOR BACKEND

### Backend (existing CRUD, complete)
- `POST /courses` — Create course
- `GET /courses` — List (psychologist's courses)
- `GET /courses/:id` — Get course with modules
- `PUT /courses/:id` — Update course
- `DELETE /courses/:id` — Delete
- `PATCH /courses/:id/publish` — Toggle publish
- `POST /courses/:id/modules` — Add module
- `PUT /courses/:id/modules/:moduleId` — Update module
- `DELETE /courses/:id/modules/:moduleId` — Delete module
- `PATCH /courses/:id/modules/reorder` — Reorder modules

### Backend additions needed
- `POST /courses/:id/modules/:moduleId/upload-url` — S3 presigned URL for video upload
- Plan limit check: count courses before `POST /courses` (Pro: max 5, Scale: unlimited)

### Frontend (to build)
- **Course list page:** Replace gated placeholder with real course grid
  - Card grid: thumbnail, title, module count, student count, draft/published badge, price
  - "Nouveau cours" button → create dialog
- **Course editor page:** `courses/[id]/edit/page.tsx`
  - Course metadata form (title, description, price) — React Hook Form + Zod
  - Publish toggle switch
  - Module list with drag-and-drop reorder (`@dnd-kit/sortable`)
  - Each module: title, content textarea, video upload slot
  - Add module button (appends to list)
- **Video upload:** Presigned URL → direct S3 upload with progress bar

### Dependencies to add
- `@dnd-kit/core@^6`, `@dnd-kit/sortable@^8`, `@dnd-kit/utilities` — Module reorder

### Components
- `course-list-content.tsx` — Grid of course cards with stats
- `create-course-dialog.tsx` — New course modal (title + description)
- `course-editor.tsx` — Full course editing form + modules
- `module-list-sortable.tsx` — Sortable module list with dnd-kit
- `module-editor-card.tsx` — Individual module form
- `video-upload-field.tsx` — Presigned URL upload with progress

---

## 4. Plan Enforcement (Transversal)

### Plans (aligned with MEMORY.md pricing)
| Plan | Price | AI Resumes/mo | Marketing Content | Courses | Analytics |
|---|---|---|---|---|---|
| Starter | 43€/mo | 10 | 0 | 0 | No |
| Pro | 69€/mo | 100 | Unlimited | 5 | Yes |
| Scale | 119€/mo | Unlimited | Unlimited | Unlimited | Yes |

### API-side (NestJS)
- Create `PlanLimitsService` in `apps/api/src/common/`
  - `checkAiLimit(psychologistId)` — Count `aiUsage` records this month vs plan limit
  - `checkCourseLimit(psychologistId)` — Count courses vs plan limit
  - Returns `{ allowed: boolean, current: number, limit: number }`
- Call before AI generation and course creation
- Return `403 { code: 'PLAN_LIMIT_EXCEEDED', limit, current, feature }` when exceeded

### Frontend-side
- Extend `FeatureLock` with optional `usage` + `limit` props for usage display
- Add usage indicator in marketing page ("8/100 résumés IA utilisés ce mois")
- Add course count indicator in courses page ("3/5 formations créées")
- Show upgrade CTA when approaching limit (80%+)

### HDS compliance
- All AI content generation logged to `aiUsage` table (already done)
- Marketing content never contains patient data (enforced by prompts)
- No additional audit_logs needed (marketing = non-sensitive data)

---

## Non-goals (out of scope)
- LinkedIn OAuth auto-posting (manual copy for now)
- Public course marketplace / student-facing pages
- Email newsletter distribution (Resend blast)
- Invoice template customization
- Multi-practitioner (Scale plan) management UI
- Push notifications (browser/mobile)
- Mobile-optimized course editor (responsive but not mobile-first)
- Course checkout/payments by external students
