# Phase 4 — Growth Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 4 growth features — dedicated marketing page, course builder UX improvements, plan enforcement with usage tracking, and analytics verification.

**Architecture:** Marketing IA frontend extracted to standalone page, course builder enhanced with dnd-kit drag-drop and module edit/delete, plan enforcement added to PLAN_LIMITS + SubscriptionGuard for courses and AI content, usage indicators in frontend.

**Tech Stack:** Next.js App Router, shadcn/ui, React Query, @dnd-kit/sortable, NestJS guards, Prisma, shared-types PLAN_LIMITS

---

## Parallel Execution Groups

These tasks can be executed in parallel groups:

- **Group A (independent):** Tasks 1, 2, 3 can run in parallel
- **Group B (depends on A):** Task 4 depends on Task 1 (PLAN_LIMITS changes)
- **Group C (depends on A+B):** Task 5 (sidebar nav) depends on Task 2+3

---

### Task 1: Add courses limit to PLAN_LIMITS + API enforcement

**Files:**
- Modify: `packages/shared-types/src/index.ts:469-474`
- Modify: `apps/api/src/billing/subscription.service.ts` (add `checkCourseLimit`)
- Modify: `apps/api/src/billing/decorators/require-plan.decorator.ts:7` (add 'courses' to BillingFeature)
- Modify: `apps/api/src/billing/guards/subscription.guard.ts:73-79` (add courses case)
- Modify: `apps/api/src/courses/courses.controller.ts` (add @RequireFeature('courses'))
- Modify: `apps/api/src/ai/ai.controller.ts` (add @RequireFeature('ai_summary') on stream-content)

- [ ] **Step 1: Add `courses` field to PLAN_LIMITS in shared-types**

In `packages/shared-types/src/index.ts`, update the PLAN_LIMITS type and values:

```typescript
export const PLAN_LIMITS: Record<SubscriptionPlan, {
  patients: number | null;
  sessions: number | null;
  aiSummaries: number;
  videoConsultations: number | null;
  courses: number | null;  // NEW
}> = {
  [SubscriptionPlan.FREE]: { patients: 5, sessions: 10, aiSummaries: 0, videoConsultations: 0, courses: 0 },
  [SubscriptionPlan.STARTER]: { patients: 40, sessions: 40, aiSummaries: 10, videoConsultations: 0, courses: 0 },
  [SubscriptionPlan.PRO]: { patients: null, sessions: null, aiSummaries: 100, videoConsultations: null, courses: 5 },
  [SubscriptionPlan.CLINIC]: { patients: null, sessions: null, aiSummaries: -1, videoConsultations: null, courses: null }, // null = unlimited
};
```

- [ ] **Step 2: Rebuild shared-types**

Run: `cd packages/shared-types && npm run build`

- [ ] **Step 3: Add `checkCourseLimit` to SubscriptionService**

In `apps/api/src/billing/subscription.service.ts`, add after `checkAiUsage`:

```typescript
async checkCourseLimit(psychologistId: string): Promise<void> {
  const sub = await this.prisma.subscription.findUnique({ where: { psychologistId } });
  const plan = (sub?.plan ?? SubscriptionPlan.FREE) as SubscriptionPlan;
  const limits = PLAN_LIMITS[plan];

  if (limits.courses === null) return; // unlimited
  if (limits.courses === -1) return;   // unlimited (Clinic)

  if (limits.courses === 0) {
    throw new ForbiddenException({
      code: 'COURSE_LIMIT',
      currentPlan: plan,
      message: 'Les formations ne sont pas disponibles sur votre plan. Passez au plan Pro.',
    });
  }

  const count = await this.prisma.course.count({ where: { psychologistId } });

  if (count >= limits.courses) {
    throw new ForbiddenException({
      code: 'COURSE_LIMIT',
      currentPlan: plan,
      currentUsage: count,
      limit: limits.courses,
      message: `Limite de ${limits.courses} formations atteinte. Passez au plan Clinic pour continuer.`,
    });
  }
}
```

- [ ] **Step 4: Add 'courses' to BillingFeature type**

In `apps/api/src/billing/decorators/require-plan.decorator.ts`, update:

```typescript
export type BillingFeature = 'patients' | 'sessions' | 'ai_summary' | 'video' | 'courses';
```

- [ ] **Step 5: Add courses case to SubscriptionGuard**

In `apps/api/src/billing/guards/subscription.guard.ts`, add after line 79:

```typescript
} else if (requiredFeature === 'courses') {
  await this.subscriptionService.checkCourseLimit(psy.id);
}
```

- [ ] **Step 6: Add @RequireFeature('courses') to course creation**

In `apps/api/src/courses/courses.controller.ts`, on the `@Post()` handler, add:

```typescript
@RequireFeature('courses')
```

Import `RequireFeature` from `'../billing/decorators/require-plan.decorator'`.

- [ ] **Step 7: Add @RequireFeature('ai_summary') to marketing content streaming**

In `apps/api/src/ai/ai.controller.ts`, on the `@Post('stream-content')` handler, add the subscription guard + feature check:

```typescript
@UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
@RequireFeature('ai_summary')
```

Import `SubscriptionGuard` from `'../billing/guards/subscription.guard'` and `RequireFeature` from `'../billing/decorators/require-plan.decorator'`.

- [ ] **Step 8: Commit**

```bash
git add packages/shared-types/src/index.ts apps/api/src/billing/ apps/api/src/courses/courses.controller.ts apps/api/src/ai/ai.controller.ts
git commit -m "feat(plan-enforcement): add course limits + AI usage guard on marketing content"
```

---

### Task 2: Dedicated Marketing Page

Extract marketing content generation from the AI Assistant page into a standalone `/dashboard/marketing` page with improved layout.

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/marketing/page.tsx`
- Create: `apps/web/src/components/marketing/marketing-gated.tsx`
- Create: `apps/web/src/components/marketing/marketing-page-content.tsx`

- [ ] **Step 1: Create marketing server page**

Create `apps/web/src/app/(dashboard)/dashboard/marketing/page.tsx`:

```tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const MarketingGated = dynamic(
  () => import('@/components/marketing/marketing-gated').then(m => m.MarketingGated),
  { ssr: false },
);

export const metadata = {
  title: 'Marketing IA — PsyLib',
  description: 'Générez du contenu marketing professionnel avec l\'IA',
};

export default async function MarketingPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return <MarketingGated />;
}
```

- [ ] **Step 2: Create marketing-gated.tsx**

Create `apps/web/src/components/marketing/marketing-gated.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { FeatureLock } from '@/components/shared/feature-lock';

const MarketingPageContent = dynamic(
  () => import('./marketing-page-content').then(m => m.MarketingPageContent),
  { ssr: false },
);

export function MarketingGated() {
  return (
    <FeatureLock
      requiredPlan="pro"
      featureName="Marketing IA"
      featureDescription="Générez des posts LinkedIn, newsletters et articles de blog optimisés avec l'IA."
      featureIcon="Sparkles"
    >
      <MarketingPageContent />
    </FeatureLock>
  );
}
```

- [ ] **Step 3: Create marketing-page-content.tsx**

Create `apps/web/src/components/marketing/marketing-page-content.tsx`.

This is the standalone version of the marketing tab from `ai-assistant-content.tsx`. Extract and refactor the "content" tab + "library" tab into a full-page layout:

- Two-column layout on desktop: left = generator form, right = streaming output
- Below: content library with saved items
- Reuse the same SSE streaming pattern (`POST /ai/stream-content`)
- Reuse the same save/delete/copy logic (`POST/GET/DELETE /ai/content-library`)
- Use `useSession()` for token (same pattern as ai-assistant-content.tsx)
- Use `useQuery` for library items (key: `['content-library']`)
- Full type configs from ai-assistant-content.tsx: `CONTENT_TYPE_CONFIG`, `TONE_CONFIG`

Key differences from ai-assistant-content.tsx:
- Full page layout (no tabs — content generation is the main content, library below)
- Two-column on lg: form left, output right
- Usage indicator at top showing AI credits used/remaining (via new API call)

- [ ] **Step 4: Verify page renders**

Run: `cd apps/web && npx next dev`
Navigate to `/dashboard/marketing` and verify the page loads.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/dashboard/marketing/ apps/web/src/components/marketing/
git commit -m "feat(marketing): add dedicated marketing IA page with content generation"
```

---

### Task 3: Course Builder UX — Module Edit, Delete, Drag-Drop Reorder

Enhance the course detail page with module editing, deletion, and drag-drop reorder.

**Files:**
- Modify: `apps/web/src/components/courses/course-detail-content.tsx`
- Modify: `apps/web/src/lib/api/courses.ts` (add updateModule, deleteModule, reorderModules)

**Dependencies:**
- Install: `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

- [ ] **Step 1: Install dnd-kit**

Run: `cd apps/web && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

- [ ] **Step 2: Add missing API methods to courses.ts**

In `apps/web/src/lib/api/courses.ts`, add to `coursesApi`:

```typescript
updateModule: (courseId: string, moduleId: string, data: Partial<CreateModuleData>, token: string) =>
  apiClient.put<CourseModule>(`/courses/${courseId}/modules/${moduleId}`, data, token),

deleteModule: (courseId: string, moduleId: string, token: string) =>
  apiClient.delete<void>(`/courses/${courseId}/modules/${moduleId}`, token),

reorderModules: (courseId: string, order: { id: string; order: number }[], token: string) =>
  apiClient.patch<void>(`/courses/${courseId}/modules/reorder`, { order }, token),
```

- [ ] **Step 3: Refactor ModuleItem to support edit/delete**

In `course-detail-content.tsx`, update `ModuleItem` to accept `onEdit`, `onDelete` callbacks:

- Add edit button (pencil icon) that toggles inline edit mode
- Add delete button (trash icon) with confirm
- In edit mode: show title input, content/videoUrl textarea, save/cancel buttons
- Use `useMutation` with `coursesApi.updateModule` and `coursesApi.deleteModule`

- [ ] **Step 4: Add drag-drop with dnd-kit**

Replace the static module list with a `SortableContext` from dnd-kit:

```tsx
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

Wrap the module list:
```tsx
<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={sortedModules.map(m => m.id)} strategy={verticalListSortingStrategy}>
    {sortedModules.map((mod, i) => (
      <SortableModuleItem key={mod.id} module={mod} index={i} ... />
    ))}
  </SortableContext>
</DndContext>
```

In `handleDragEnd`, call `coursesApi.reorderModules` with the new order.

Make `ModuleItem` use `useSortable` hook:
```tsx
const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id });
const style = { transform: CSS.Transform.toString(transform), transition };
```

Apply `ref={setNodeRef}` and `style` to the module container, `{...attributes} {...listeners}` to the drag handle.

- [ ] **Step 5: Remove the "prochainement" text**

Delete the line: `La réorganisation par glisser-déposer sera disponible prochainement.`

- [ ] **Step 6: Test drag-drop and module CRUD**

Run dev server, navigate to a course detail page:
- Create a course with 3+ modules
- Verify drag-drop reorders correctly
- Verify edit module updates title/content
- Verify delete module removes it
- Verify changes persist after refresh

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/courses/ apps/web/src/lib/api/courses.ts apps/web/package.json apps/web/package-lock.json
git commit -m "feat(courses): add module edit, delete, and drag-drop reorder"
```

---

### Task 4: Frontend Usage Indicators

Add usage indicators to show AI credits and course slots remaining.

**Files:**
- Create: `apps/web/src/lib/api/usage.ts`
- Create: `apps/web/src/components/shared/usage-indicator.tsx`
- Modify: `apps/web/src/components/marketing/marketing-page-content.tsx` (add usage indicator)
- Modify: `apps/web/src/components/courses/courses-content.tsx` (add course count indicator)

**Backend dependency:**
- Create: `apps/api/src/billing/billing.controller.ts` — add `GET /billing/usage` endpoint (or add to existing)

- [ ] **Step 1: Add usage endpoint to API**

In `apps/api/src/billing/billing.controller.ts`, add:

```typescript
@Get('usage')
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
async getUsage(@CurrentUser() user: KeycloakUser) {
  const psy = await this.prisma.psychologist.findUnique({
    where: { userId: user.sub },
    include: { subscription: true },
  });
  if (!psy) throw new ForbiddenException();

  const plan = (psy.subscription?.plan ?? 'free') as SubscriptionPlan;
  const limits = PLAN_LIMITS[plan];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [aiUsageCount, courseCount] = await Promise.all([
    this.prisma.aiUsage.count({
      where: { psychologistId: psy.id, createdAt: { gte: startOfMonth } },
    }),
    this.prisma.course.count({ where: { psychologistId: psy.id } }),
  ]);

  return {
    ai: {
      used: aiUsageCount,
      limit: limits.aiSummaries, // -1 = unlimited, 0 = none
    },
    courses: {
      used: courseCount,
      limit: limits.courses, // null = unlimited, 0 = none
    },
    plan,
  };
}
```

Import `PLAN_LIMITS, SubscriptionPlan` from `@psyscale/shared-types`.

- [ ] **Step 2: Create usage API client**

Create `apps/web/src/lib/api/usage.ts`:

```typescript
import { apiClient } from './client';

export interface UsageData {
  ai: { used: number; limit: number };
  courses: { used: number; limit: number | null };
  plan: string;
}

export const usageApi = {
  getUsage: (token: string) =>
    apiClient.get<UsageData>('/billing/usage', token),
};
```

- [ ] **Step 3: Create UsageIndicator component**

Create `apps/web/src/components/shared/usage-indicator.tsx`:

```tsx
'use client';

interface UsageIndicatorProps {
  label: string;
  used: number;
  limit: number | null; // null or -1 = unlimited
}

export function UsageIndicator({ label, used, limit }: UsageIndicatorProps) {
  const isUnlimited = limit === null || limit === -1;
  const percentage = isUnlimited ? 0 : limit > 0 ? Math.round((used / limit) * 100) : 0;
  const isWarning = !isUnlimited && percentage >= 80;
  const isDanger = !isUnlimited && percentage >= 100;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        'font-medium',
        isDanger ? 'text-destructive' : isWarning ? 'text-amber-600' : 'text-foreground',
      )}>
        {used}{isUnlimited ? '' : `/${limit}`}
      </span>
      {!isUnlimited && limit > 0 && (
        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isDanger ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary',
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

Import `cn` from `@/lib/utils`.

- [ ] **Step 4: Add usage indicator to marketing page**

In `marketing-page-content.tsx`, add at the top of the page header:

```tsx
const { data: usage } = useQuery({
  queryKey: ['billing-usage'],
  queryFn: () => usageApi.getUsage(token),
  enabled: !!token,
  staleTime: 60_000,
});

// In JSX, after the page title:
{usage && (
  <UsageIndicator label="Crédits IA ce mois" used={usage.ai.used} limit={usage.ai.limit} />
)}
```

- [ ] **Step 5: Add course count indicator to courses page**

In `courses-content.tsx`, add near the "Nouveau cours" button:

```tsx
{usage && (
  <UsageIndicator label="Formations" used={usage.courses.used} limit={usage.courses.limit} />
)}
```

Disable the create button when limit reached.

- [ ] **Step 6: Test usage indicators**

Verify on dev server:
- Marketing page shows "X/100 crédits IA ce mois" (or "X" if unlimited)
- Courses page shows "X/5 formations" (or "X" if unlimited)
- Warning color at 80%+, red at 100%
- Create course button disabled when limit reached

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/billing/ apps/web/src/lib/api/usage.ts apps/web/src/components/shared/usage-indicator.tsx apps/web/src/components/marketing/ apps/web/src/components/courses/
git commit -m "feat(usage): add plan usage indicators for AI credits and course limits"
```

---

### Task 5: Sidebar Navigation + Final Cleanup

Add Marketing to sidebar nav and verify everything works together.

**Files:**
- Modify: `apps/web/src/components/layouts/sidebar.tsx` (add Marketing nav item)

- [ ] **Step 1: Add Marketing to sidebar nav**

In `apps/web/src/components/layouts/sidebar.tsx`, add to NAV_ITEMS after "Assistant IA":

```typescript
{ href: '/dashboard/marketing', label: 'Marketing IA', icon: Megaphone },
```

Import `Megaphone` from `lucide-react`.

- [ ] **Step 2: Verify navigation**

Run dev server:
- Sidebar shows "Marketing IA" link
- Clicking navigates to `/dashboard/marketing`
- Page loads with content generation form
- Back to AI Assistant — exercise tab still works
- Analytics page loads with charts
- Courses page loads with course list + usage indicator

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layouts/sidebar.tsx
git commit -m "feat(nav): add Marketing IA to sidebar navigation"
```

---

### Task 6: Analytics Verification

Verify analytics page works end-to-end. No code changes expected — just testing.

- [ ] **Step 1: Verify analytics page loads**

Navigate to `/dashboard/analytics`:
- KPI cards render (may show 0 if no data)
- Revenue bar chart renders
- Patient growth line chart renders
- Mood trends render
- Feature lock works (redirect to upgrade for Starter plan)

- [ ] **Step 2: Note any visual bugs**

If charts have rendering issues, fix them. Common issues:
- Empty data states (charts should handle 0 data gracefully)
- Responsive layout on mobile
- Loading skeletons display correctly

- [ ] **Step 3: Commit if fixes needed**

```bash
git add -A && git commit -m "fix(analytics): visual polish and edge case handling"
```

---

### Task 7: Final Integration Commit

- [ ] **Step 1: Run type check**

Run: `cd apps/web && npx tsc --noEmit`
Run: `cd apps/api && npx tsc --noEmit`

Fix any type errors.

- [ ] **Step 2: Run linter**

Run: `cd apps/web && npx next lint`

Fix any lint errors.

- [ ] **Step 3: Final commit**

```bash
git add -A && git commit -m "feat(phase4): complete growth features — marketing IA, course builder, plan enforcement, analytics"
```
