# Instant Video Consultation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow psychologists to start instant video consultations without a prior appointment, optionally linked to a patient.

**Architecture:** Reuse existing Appointment/VideoRoom/LiveKit flow. A new `POST /video/instant` endpoint creates an Appointment with `source = "instant"` + VideoRoom in one operation. Making `patientId` nullable on Appointment enables patient-less instant rooms. All existing services that access `appointment.patient.*` get null guards.

**Tech Stack:** NestJS, Prisma, LiveKit, Next.js, React Query, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-05-13-instant-video-design.md`

---

### Task 1: Schema Migration — Make patientId nullable on Appointment

**Files:**
- Modify: `apps/api/prisma/schema.prisma:742,768`
- Create: `apps/api/prisma/migrations/20260513_instant_video/migration.sql`

- [ ] **Step 1: Update Prisma schema**

In `apps/api/prisma/schema.prisma`, change the Appointment model:

Line 742: `patientId  String  @map("patient_id")` → `patientId  String?  @map("patient_id")`

Line 768: `patient  Patient  @relation(...)` → `patient  Patient?  @relation(...)`

- [ ] **Step 2: Generate migration**

Run: `cd apps/api && npx prisma migrate dev --name instant_video --create-only`

Verify the generated SQL contains: `ALTER TABLE "appointments" ALTER COLUMN "patient_id" DROP NOT NULL;`

- [ ] **Step 3: Commit**

```
git add apps/api/prisma/
git commit -m "schema: make appointment.patientId nullable for instant video"
```

---

### Task 2: Backend — DTO + Endpoint

**Files:**
- Modify: `apps/api/src/video/dto/video.dto.ts:25-35`
- Modify: `apps/api/src/video/video.controller.ts`

- [ ] **Step 1: Add CreateInstantVideoDto and update TodayVideoRoom**

In `apps/api/src/video/dto/video.dto.ts`:

Add DTO class:
```typescript
import { IsOptional, IsUUID } from 'class-validator';

export class CreateInstantVideoDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;
}
```

Change `TodayVideoRoom` interface (line 27):
`patientName: string;` → `patientName: string | null;`

- [ ] **Step 2: Add POST /video/instant endpoint**

In `apps/api/src/video/video.controller.ts`, add new endpoint (after the existing `POST /video/rooms` at line 43):

```typescript
@Post('instant')
@UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
@Roles('psychologist')
@RequireFeature('video')
@Throttle({ default: { limit: 10, ttl: 60000 } })
@ApiOperation({ summary: 'Créer une visio instantanée (sans RDV préalable)' })
@ApiResponse({ status: 201, description: 'Visio instantanée créée' })
async createInstantRoom(
  @Body() dto: CreateInstantVideoDto,
  @CurrentUser() user: KeycloakUser,
) {
  return this.videoService.createInstantRoom(user.sub, dto.patientId);
}
```

Import `CreateInstantVideoDto` from dto file and `Throttle` from `@nestjs/throttler`.

- [ ] **Step 3: Commit**

```
git add apps/api/src/video/
git commit -m "feat(video): add instant video DTO and controller endpoint"
```

---

### Task 3: Backend — VideoService.createInstantRoom()

**Files:**
- Modify: `apps/api/src/video/video.service.ts`

- [ ] **Step 1: Add createInstantRoom method**

In `apps/api/src/video/video.service.ts`, add after `createRoom()` (after line 118):

```typescript
/**
 * Creates an instant video room — no prior appointment required.
 * Optionally linked to a patient. Returns token + patient link.
 */
async createInstantRoom(userId: string, patientId?: string) {
  if (!this.livekitApiKey || !this.livekitApiSecret || !this.livekitWsUrl) {
    throw new ForbiddenException('Visio non configurée — clés LiveKit manquantes');
  }

  const psy = await this.getPsychologist(userId);

  // Verify patient belongs to psy if provided
  if (patientId) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');
  }

  const videoJoinToken = crypto.randomUUID();

  // Create instant appointment
  const appointment = await this.prisma.appointment.create({
    data: {
      psychologistId: psy.id,
      patientId: patientId ?? null,
      scheduledAt: new Date(),
      duration: 120,
      status: 'confirmed',
      isOnline: true,
      source: 'instant',
      videoJoinToken,
    },
  });

  // Create LiveKit room — rollback appointment on failure
  const roomName = `psylib-${appointment.id}`;
  try {
    await this.roomService.createRoom({
      name: roomName,
      emptyTimeout: 300,
    });
  } catch (e) {
    await this.prisma.appointment.delete({ where: { id: appointment.id } });
    this.logger.error(`Failed to create LiveKit room for instant video: ${e}`);
    throw new BadRequestException('Impossible de créer la salle de visio — le serveur vidéo est indisponible');
  }

  const videoRoom = await this.prisma.videoRoom.create({
    data: {
      appointmentId: appointment.id,
      psychologistId: psy.id,
      roomName,
      status: 'waiting',
    },
  });

  // Generate psy token
  const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
    identity: `psy-${psy.id}`,
    name: psy.name || 'Psychologue',
    ttl: 150 * 60, // 2h30 in seconds
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  };
  token.addGrant(grant);

  // Mark psy as joined
  await this.prisma.videoRoom.update({
    where: { id: videoRoom.id },
    data: { psyJoinedAt: new Date(), status: 'active' },
  });

  await this.audit.log({
    actorId: psy.userId,
    actorType: 'psychologist',
    action: 'VIDEO_INSTANT_CREATED',
    entityType: 'video_room',
    entityId: videoRoom.id,
    metadata: { appointmentId: appointment.id, patientId: patientId ?? null },
  });

  const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';

  return {
    appointmentId: appointment.id,
    token: await token.toJwt(),
    wsUrl: this.livekitWsUrl,
    roomName,
    patientLink: `${frontendUrl}/patient-portal/video/${videoJoinToken}`,
    durationMin: 120,
  };
}
```

Add `import * as crypto from 'crypto';` at top if not already present (it is in patient-invitation.service but check video.service).

- [ ] **Step 2: Commit**

```
git add apps/api/src/video/video.service.ts
git commit -m "feat(video): implement createInstantRoom service method"
```

---

### Task 4: Backend — Null guards on existing VideoService methods

**Files:**
- Modify: `apps/api/src/video/video.service.ts`

- [ ] **Step 1: Fix createRoom() — bypass time window for instant**

At line 77, change the time window check to skip instant appointments:

```typescript
if (appointment.source !== 'instant' && (now < windowStart || now > windowEnd)) {
  throw new BadRequestException('La visio ne peut être démarrée que 10 min avant le RDV');
}
```

- [ ] **Step 2: Fix generatePatientToken() — null patient guard**

At lines 205-208, add null guard:

```typescript
if (appointment) {
  patientId = appointment.patient?.id ?? 'anonymous';
  patientName = appointment.patient?.name ?? 'Participant';
  psychologistName = appointment.psychologist.name;
}
```

- [ ] **Step 3: Fix recordConsent() — skip if no patient**

At lines 326-335, wrap in null check:

```typescript
if (appointment) {
  if (appointment.patientId) {
    await this.prisma.gdprConsent.create({
      data: {
        patientId: appointment.patientId,
        type: 'video_consultation',
        version: '2026-04-v1',
        ipAddress,
      },
    });
  }
  return;
}
```

Similarly at lines 344-351 for participant consent.

- [ ] **Step 4: Fix endRoom() — skip Session if no patient**

At lines 397-414, wrap session creation:

```typescript
// Auto-create session if none linked AND patient exists
if (!room.appointment.sessionId && room.appointment.patientId) {
  // ... existing session creation code
}
```

- [ ] **Step 5: Fix getTodayRooms() — nullable patient**

At line 449, make patient include optional by using the already-optional relation. At line 487:

```typescript
patientName: appt.patient?.name ?? null,
```

- [ ] **Step 6: Commit**

```
git add apps/api/src/video/video.service.ts
git commit -m "fix(video): add null guards for nullable patientId on appointments"
```

---

### Task 5: Backend — Null guards on dependent services

**Files:**
- Modify: `apps/api/src/reminder/reminder.service.ts:47-58`
- Modify: `apps/api/src/calendar-sync/calendar-sync.service.ts:298-307`
- Modify: `apps/api/src/appointments/appointments.service.ts:348-397,447-577`

- [ ] **Step 1: Fix ReminderService — exclude instant rooms**

In `apps/api/src/reminder/reminder.service.ts`, at the appointment query WHERE clause (around line 47), add:

```typescript
patientId: { not: null },
source: { not: 'instant' },
```

This excludes instant rooms from reminders entirely.

- [ ] **Step 2: Fix CalendarSyncService — skip instant rooms**

In `apps/api/src/calendar-sync/calendar-sync.service.ts`, at the `@OnEvent('appointment.created')` handler (line 298), add early return:

```typescript
@OnEvent('appointment.created')
async handleAppointmentCreated(event: AppointmentEventPayload): Promise<void> {
  if (event.source === 'instant') return; // Don't sync instant rooms to Google Calendar
  try {
    await this.pushToGoogle('create', event);
  } catch (err) { ... }
}
```

Do the same for `appointment.updated` and `appointment.cancelled` handlers.

Also in `pushToGoogle` (line 356), add null guard:

```typescript
const summary = appointment.patient?.name
  ? `Consultation — ${appointment.patient.name}`
  : 'Visio instantanée';
```

- [ ] **Step 3: Fix AppointmentsService — null guards**

In `apps/api/src/appointments/appointments.service.ts`:

- `confirmAppointment` (line 362): `existing.patient?.email`, `existing.patient?.name` — skip email notification if patient is null
- `declineAppointment` (line 388): same pattern
- `cancelByToken` (line 523): null guard on `appointment.patient?.email`, `appointment.patient?.name`

For each: wrap the email/notification sending in `if (appointment.patient) { ... }`.

- [ ] **Step 4: Commit**

```
git add apps/api/src/reminder/ apps/api/src/calendar-sync/ apps/api/src/appointments/
git commit -m "fix: null guards for nullable appointment.patientId in dependent services"
```

---

### Task 6: Frontend — API client + Video page button

**Files:**
- Modify: `apps/web/src/lib/api/video.ts`
- Modify: `apps/web/src/app/(dashboard)/dashboard/video/page.tsx`

- [ ] **Step 1: Add createInstantRoom to API client**

In `apps/web/src/lib/api/video.ts`, add:

```typescript
createInstantRoom: (patientId: string | undefined, token: string) =>
  apiClient.post<{
    appointmentId: string;
    token: string;
    wsUrl: string;
    roomName: string;
    patientLink: string;
    durationMin: number;
  }>('/video/instant', { patientId }, token),
```

- [ ] **Step 2: Add instant video dialog to video page**

In `apps/web/src/app/(dashboard)/dashboard/video/page.tsx`:

Add a "Nouvelle visio" button next to the title. Add a dialog with:
- Patient combobox (search from `/patients?search=X&limit=5`, optional)
- "Demarrer" button
- On submit: call `videoApi.createInstantRoom(patientId, token)`, then `router.push(/video/${result.appointmentId}?patientLink=${encodeURIComponent(result.patientLink)})`

Also fix null patientName: where `room.patientName` is rendered (line 81), use `room.patientName ?? 'Visio libre'`.

- [ ] **Step 3: Commit**

```
git add apps/web/src/lib/api/video.ts apps/web/src/app/\(dashboard\)/dashboard/video/
git commit -m "feat(frontend): instant video button and dialog on video page"
```

---

### Task 7: Frontend — Patient link banner in video room

**Files:**
- Modify: `apps/web/src/app/(dashboard)/video/[roomId]/page.tsx`

- [ ] **Step 1: Add patient link banner**

In `apps/web/src/app/(dashboard)/video/[roomId]/page.tsx`:

Read `patientLink` from URL search params. If present, show a banner above the video:

```tsx
{patientLink && !patientJoined && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
    <span className="text-sm text-blue-700 shrink-0">Partagez ce lien avec votre patient :</span>
    <input
      readOnly
      value={patientLink}
      className="flex-1 bg-white border border-blue-200 rounded px-3 py-1.5 text-sm text-foreground select-all"
      onClick={(e) => (e.target as HTMLInputElement).select()}
    />
    <button
      onClick={() => { navigator.clipboard.writeText(patientLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
    >
      {copied ? 'Copié !' : 'Copier'}
    </button>
  </div>
)}
```

Add state: `const [copied, setCopied] = useState(false);`
Get patientLink: `const searchParams = useSearchParams(); const patientLink = searchParams.get('patientLink');`

The banner disappears when `patientJoined` becomes true (listen to the existing `video_patient_joined` WebSocket notification — already in the codebase via NotificationGateway).

- [ ] **Step 2: Commit**

```
git add apps/web/src/app/\(dashboard\)/video/
git commit -m "feat(frontend): patient link banner in instant video room"
```

---

### Task 8: Final commit + Deploy

- [ ] **Step 1: Run Prisma generate locally**

```
cd apps/api && npx prisma generate
```

- [ ] **Step 2: Build check**

```
cd apps/web && npx next build
```

Fix any TypeScript errors from the nullable patientId changes.

- [ ] **Step 3: Final commit if needed**

- [ ] **Step 4: Deploy Vercel**

```
cd /c/Users/tonyr/OneDrive/Projet/PsyFlow && npx vercel --prod --yes
```

- [ ] **Step 5: Deploy VPS**

Build and upload Docker image, run migration:
```bash
# From project root
tar -czf psyscale-src-latest.tar.gz --exclude=node_modules --exclude=.next --exclude=dist --exclude=apps/web --exclude=apps/mobile --exclude=tmp --exclude=.claude --exclude=.playwright-mcp --exclude=.superpowers --exclude=.vercel --exclude=BOOKING apps/api packages prisma package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json

scp -i ~/.ssh/psyscale_ovh psyscale-src-latest.tar.gz ubuntu@51.178.31.68:/opt/psyscale-api/

ssh -i ~/.ssh/psyscale_ovh ubuntu@51.178.31.68 'cd /opt/psyscale-api && sudo mkdir -p build-ctx && sudo tar -xzf psyscale-src-latest.tar.gz -C build-ctx && sudo cp Dockerfile build-ctx/ && cd build-ctx && sudo docker build -t psyscale-api:latest . && cd .. && sudo docker compose down api && sudo docker compose up -d api && sleep 5 && sudo docker compose exec -T api npx prisma migrate deploy && sudo docker compose restart api'
```

- [ ] **Step 6: Verify deployment**

Test the API: `curl -s https://api.psylib.eu/api/v1/video/instant -H "Authorization: Bearer test" | head`
Should return 401 (auth required) not 404 (route not found).
