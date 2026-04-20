# Multi-Participant Video Consultation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable couple/family video therapy sessions with 2-5 patients in a single LiveKit room.

**Architecture:** Pivot table `appointment_participants` extends the existing appointment model. Each participant gets their own `videoJoinToken`. The `VideoRoom` and existing 1:1 flow remain untouched. Frontend gains an adaptive video grid and multi-select patient picker.

**Tech Stack:** NestJS, Prisma, LiveKit, Next.js, @livekit/components-react, TailwindCSS

**Spec:** `docs/superpowers/specs/2026-04-20-multi-participant-video-design.md`

---

## File Structure

### New files
- `apps/api/prisma/migrations/20260420_add_appointment_participants/migration.sql`
- `apps/api/src/appointments/dto/create-group-appointment.dto.ts`
- `apps/api/src/appointments/__tests__/group-appointment.spec.ts`
- `apps/api/src/video/__tests__/video-group.spec.ts`
- `apps/web/src/components/calendar/participant-multi-select.tsx`
- `apps/web/src/components/video/video-grid.tsx`

### Modified files
- `apps/api/prisma/schema.prisma` — Add `AppointmentParticipant` model + relation + `Session.participantIds`
- `apps/api/src/appointments/appointments.module.ts` — Import `BillingModule`
- `apps/api/src/appointments/appointments.controller.ts` — Add `POST /appointments/group`
- `apps/api/src/appointments/appointments.service.ts` — Add `createGroup()` method
- `apps/api/src/video/video.service.ts` — Modify `generatePatientToken`, `recordConsent`, `createRoom`, `endRoom`, `getTodayRooms`
- `apps/api/src/video/dto/video.dto.ts` — Update `TodayVideoRoom` type
- `apps/api/src/notifications/email-sequence.service.ts` — Send video links to participants
- `apps/web/src/components/calendar/create-appointment-dialog.tsx` — Add participant picker
- `apps/web/src/components/video/video-room.tsx` — Replace fixed layout with adaptive grid
- `apps/web/src/lib/api/video.ts` — Update `TodayRoom` type
- `packages/shared-types/src/index.ts` — Add `AuditAction.VIDEO_PARTICIPANT_JOIN`

---

## Task 1: Database Migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260420_add_appointment_participants/migration.sql`

- [ ] **Step 1: Add AppointmentParticipant model to schema.prisma**

After the `VideoRoom` model (line ~626), add:

```prisma
model AppointmentParticipant {
  id              String    @id @default(uuid())
  appointmentId   String    @map("appointment_id")
  patientId       String    @map("patient_id")
  videoJoinToken  String?   @unique @map("video_join_token")
  videoLinkSentAt DateTime? @map("video_link_sent_at")
  joinedAt        DateTime? @map("joined_at")
  createdAt       DateTime  @default(now()) @map("created_at")

  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  patient     Patient     @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@unique([appointmentId, patientId])
  @@index([patientId])
  @@index([videoJoinToken])
  @@map("appointment_participants")
}
```

- [ ] **Step 2: Add participantIds to Session model**

In the `Session` model, add after `paymentStatus`:

```prisma
  participantIds String[] @default([]) @map("participant_ids")
```

- [ ] **Step 3: Add relations to Appointment and Patient models**

In the `Appointment` model, add:
```prisma
  participants AppointmentParticipant[]
```

In the `Patient` model, add:
```prisma
  appointmentParticipations AppointmentParticipant[]
```

- [ ] **Step 4: Generate migration**

Run: `cd apps/api && npx prisma migrate dev --name add_appointment_participants`

If the auto-generated SQL has issues, create manual migration:

```sql
-- CreateTable: appointment_participants
CREATE TABLE "appointment_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "video_join_token" TEXT,
    "video_link_sent_at" TIMESTAMPTZ,
    "joined_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "appointment_participants_pkey" PRIMARY KEY ("id")
);

-- Add participantIds to sessions
ALTER TABLE "sessions" ADD COLUMN "participant_ids" TEXT[] NOT NULL DEFAULT '{}';

-- Unique constraints
CREATE UNIQUE INDEX "appointment_participants_video_join_token_key" ON "appointment_participants"("video_join_token");
CREATE UNIQUE INDEX "appointment_participants_appointment_id_patient_id_key" ON "appointment_participants"("appointment_id", "patient_id");

-- Indexes
CREATE INDEX "appointment_participants_patient_id_idx" ON "appointment_participants"("patient_id");
CREATE INDEX "appointment_participants_video_join_token_idx" ON "appointment_participants"("video_join_token");

-- Foreign keys
ALTER TABLE "appointment_participants" ADD CONSTRAINT "appointment_participants_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE;
ALTER TABLE "appointment_participants" ADD CONSTRAINT "appointment_participants_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE;
```

- [ ] **Step 5: Verify migration applies cleanly**

Run: `cd apps/api && npx prisma migrate dev`
Expected: Migration applied, Prisma Client regenerated.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/
git commit -m "feat(db): add appointment_participants table and session participantIds column"
```

---

## Task 2: Backend — Group Appointment DTO & Service

**Files:**
- Create: `apps/api/src/appointments/dto/create-group-appointment.dto.ts`
- Modify: `apps/api/src/appointments/appointments.service.ts`
- Modify: `apps/api/src/appointments/appointments.controller.ts`

> Note: `BillingModule` is already imported in `AppointmentsModule` (via `forwardRef`). No module change needed.

- [ ] **Step 1: Create the DTO**

Create `apps/api/src/appointments/dto/create-group-appointment.dto.ts`:

```typescript
import {
  IsUUID,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator';

export class CreateGroupAppointmentDto {
  @IsUUID()
  patientId!: string; // Primary patient (billed)

  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  participantIds!: string[]; // Additional participants (1-4)

  @IsDateString()
  scheduledAt!: string;

  @IsInt()
  @Min(15)
  @Max(180)
  duration!: number;

  @IsOptional()
  @IsUUID()
  consultationTypeId?: string;
}
```

- [ ] **Step 2: Add createGroup method to appointments.service.ts**

Add to `AppointmentsService`:

```typescript
import { randomUUID } from 'crypto';
import { CreateGroupAppointmentDto } from './dto/create-group-appointment.dto';

async createGroup(userId: string, dto: CreateGroupAppointmentDto) {
  const psy = await this.getPsychologist(userId);

  // Validate: no duplicates, patientId not in participantIds
  const allPatientIds = [dto.patientId, ...dto.participantIds];
  const uniqueIds = new Set(allPatientIds);
  if (uniqueIds.size !== allPatientIds.length) {
    throw new BadRequestException('Duplicate patient IDs detected');
  }

  // Validate: all patients belong to this psychologist
  const patients = await this.prisma.patient.findMany({
    where: { id: { in: allPatientIds }, psychologistId: psy.id },
    select: { id: true, email: true, name: true },
  });
  if (patients.length !== allPatientIds.length) {
    throw new BadRequestException('One or more patients not found or not owned by this psychologist');
  }

  // Create appointment with primary patient
  const videoJoinToken = randomUUID();
  const appointment = await this.prisma.appointment.create({
    data: {
      psychologistId: psy.id,
      patientId: dto.patientId,
      scheduledAt: new Date(dto.scheduledAt),
      duration: dto.duration,
      status: 'scheduled',
      isOnline: true,
      videoJoinToken,
      consultationTypeId: dto.consultationTypeId || null,
    },
  });

  // Create participant rows with individual tokens
  const participantRows = dto.participantIds.map((pid) => ({
    appointmentId: appointment.id,
    patientId: pid,
    videoJoinToken: randomUUID(),
  }));

  await this.prisma.appointmentParticipant.createMany({
    data: participantRows,
  });

  // Identify participants without email for warning
  const participantsWithoutEmail = patients
    .filter((p) => dto.participantIds.includes(p.id) && !p.email)
    .map((p) => p.id);

  // Audit log
  await this.audit.log({
    actorId: psy.userId,
    actorType: 'psychologist',
    action: 'CREATE',
    entityType: 'appointment',
    entityId: appointment.id,
    metadata: {
      isGroup: true,
      primaryPatientId: dto.patientId,
      participantIds: dto.participantIds,
    },
  });

  return {
    ...appointment,
    participants: participantRows,
    participantsWithoutEmail,
  };
}
```

- [ ] **Step 3: Add controller endpoint**

In `apps/api/src/appointments/appointments.controller.ts`, add:

```typescript
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequirePlan } from '../billing/decorators/require-plan.decorator';
import { SubscriptionPlan } from '@psyscale/shared-types';
import { CreateGroupAppointmentDto } from './dto/create-group-appointment.dto';

@Post('group')
@UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
@Roles('psychologist', 'admin')
@RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
async createGroup(
  @Body() dto: CreateGroupAppointmentDto,
  @CurrentUser() user: KeycloakUser,
) {
  return this.appointmentsService.createGroup(user.sub, dto);
}
```

- [ ] **Step 4: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/appointments/
git commit -m "feat(appointments): add POST /appointments/group endpoint for multi-participant video"
```

---

## Task 3: Backend — Video Service Modifications

**Files:**
- Modify: `apps/api/src/video/video.service.ts`
- Modify: `apps/api/src/video/dto/video.dto.ts`

- [ ] **Step 1: Modify generatePatientToken to support participant tokens**

In `video.service.ts`, replace the `generatePatientToken` method:

```typescript
async generatePatientToken(
  joinToken: string,
): Promise<VideoTokenResponse & { needsConsent?: boolean }> {
  // First: check primary patient token on appointment
  let appointment = await this.prisma.appointment.findFirst({
    where: { videoJoinToken: joinToken },
    include: {
      videoRoom: true,
      patient: { select: { id: true, name: true } },
      psychologist: { select: { name: true } },
    },
  });

  let patientId: string;
  let patientName: string;
  let psychologistName: string;

  if (appointment) {
    patientId = appointment.patient.id;
    patientName = appointment.patient.name;
    psychologistName = appointment.psychologist.name;
  } else {
    // Second: check participant token
    const participant = await this.prisma.appointmentParticipant.findFirst({
      where: { videoJoinToken: joinToken },
      include: {
        patient: { select: { id: true, name: true } },
        appointment: {
          include: {
            videoRoom: true,
            psychologist: { select: { name: true } },
          },
        },
      },
    });

    if (!participant) throw new UnauthorizedException('Lien de visio invalide ou expire');

    // Re-assign appointment from participant's relation
    appointment = participant.appointment;
    patientId = participant.patient.id;
    patientName = participant.patient.name;
    psychologistName = participant.appointment.psychologist.name;
  }

  if (!appointment!.videoRoom)
    throw new BadRequestException("La salle de visio n'est pas encore prete");
  if (appointment!.videoRoom.status === 'ended')
    throw new BadRequestException('Cette consultation est terminee');

  // Check GDPR consent for THIS participant
  const consent = await this.prisma.gdprConsent.findFirst({
    where: {
      patientId,
      type: 'video_consultation',
      withdrawnAt: null,
    },
  });

  if (!consent) {
    return {
      needsConsent: true,
      token: '',
      wsUrl: '',
      roomName: '',
      patientName,
      psychologistName,
    } as any;
  }

  const room = appointment!.videoRoom!;
  const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
    identity: `patient-${patientId}`,
    name: patientName || 'Patient',
    ttl: (appointment!.duration + 30) * 60,
  });
  const grant: VideoGrant = {
    room: room.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  };
  token.addGrant(grant);

  // Update join tracking
  if (!room.patientJoinedAt) {
    // First participant to join (primary or secondary) updates VideoRoom
    await this.prisma.videoRoom.update({
      where: { id: room.id },
      data: { patientJoinedAt: new Date(), status: 'active' },
    });
  }

  // If this is a secondary participant, update their joinedAt
  if (patientId !== appointment!.patientId) {
    await this.prisma.appointmentParticipant.updateMany({
      where: { appointmentId: appointment!.id, patientId },
      data: { joinedAt: new Date() },
    });
  }

  await this.audit.log({
    actorId: patientId,
    actorType: 'patient',
    action: 'VIDEO_PATIENT_JOIN',
    entityType: 'video_room',
    entityId: room.id,
  });

  return {
    token: await token.toJwt(),
    wsUrl: this.livekitWsUrl,
    roomName: room.roomName,
  };
}
```

- [ ] **Step 2: Modify recordConsent to support participant tokens**

Replace the `recordConsent` method:

```typescript
async recordConsent(joinToken: string, ipAddress?: string) {
  // Check primary patient token
  const appointment = await this.prisma.appointment.findFirst({
    where: { videoJoinToken: joinToken },
  });

  if (appointment) {
    await this.prisma.gdprConsent.create({
      data: {
        patientId: appointment.patientId,
        type: 'video_consultation',
        version: '2026-04-v1',
        ipAddress,
      },
    });
    return;
  }

  // Check participant token
  const participant = await this.prisma.appointmentParticipant.findFirst({
    where: { videoJoinToken: joinToken },
  });
  if (!participant) throw new UnauthorizedException('Lien invalide');

  await this.prisma.gdprConsent.create({
    data: {
      patientId: participant.patientId,
      type: 'video_consultation',
      version: '2026-04-v1',
      ipAddress,
    },
  });
}
```

- [ ] **Step 3: Modify createRoom for group settings**

In the `createRoom` method, after validating the appointment (around line 75), check for participants:

```typescript
// Check if this is a group appointment
const participantCount = await this.prisma.appointmentParticipant.count({
  where: { appointmentId },
});

const isGroup = participantCount > 0;
const roomName = `psylib-${appointmentId}`;
await this.roomService.createRoom({
  name: roomName,
  emptyTimeout: isGroup ? 600 : 300,
  maxParticipants: isGroup ? 6 : undefined,
});
```

- [ ] **Step 4: Modify endRoom for group sessions**

In the `endRoom` method, when creating the auto-session (around line 287), add participant IDs:

```typescript
// Get participant IDs for group sessions
const participants = await this.prisma.appointmentParticipant.findMany({
  where: { appointmentId },
  select: { patientId: true },
});
const participantIds = participants.map((p) => p.patientId);

// Auto-create session if none linked
if (!room.appointment.sessionId) {
  const session = await this.prisma.session.create({
    data: {
      patientId: room.appointment.patientId,
      psychologistId: psy.id,
      date: startTime,
      duration: durationMinutes,
      type: participantIds.length > 0 ? 'group' : 'online',
      notes: '',
      paymentStatus: 'pending',
      participantIds,
    },
  });
  await this.prisma.appointment.update({
    where: { id: appointmentId },
    data: { sessionId: session.id },
  });
}
```

- [ ] **Step 5: Modify getTodayRooms to include participant info**

Update the `getTodayRooms` method to include participants:

```typescript
async getTodayRooms(userId: string): Promise<TodayVideoRoom[]> {
  const psy = await this.getPsychologist(userId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await this.prisma.appointment.findMany({
    where: {
      psychologistId: psy.id,
      isOnline: true,
      scheduledAt: { gte: today, lt: tomorrow },
      status: { notIn: ['cancelled'] },
    },
    include: {
      patient: { select: { name: true } },
      videoRoom: true,
      participants: { select: { patientId: true, joinedAt: true, patient: { select: { name: true } } } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  const now = new Date();
  return appointments.map((appt) => {
    let status: TodayVideoRoom['status'] = 'upcoming';
    const windowStart = new Date(appt.scheduledAt.getTime() - 10 * 60 * 1000);

    if (appt.videoRoom?.status === 'ended') {
      status = 'ended';
    } else if (appt.videoRoom?.psyJoinedAt && appt.videoRoom?.patientJoinedAt) {
      status = 'active';
    } else if (appt.videoRoom?.patientJoinedAt) {
      status = 'patient_waiting';
    } else if (now >= windowStart) {
      status = 'ready';
    }

    const participantCount = 1 + appt.participants.length; // primary + additionals
    // Count joined: secondary participants with joinedAt + primary if room has patientJoinedAt
    // Note: patientJoinedAt is set by first joiner (primary or secondary), but for counting
    // we check if primary's identity has joined via the room's patientJoinedAt
    const secondaryJoined = appt.participants.filter((p) => p.joinedAt).length;
    const primaryJoined = appt.videoRoom?.patientJoinedAt && appt.participants.length === 0
      ? 1  // 1:1 appointment
      : (appt.videoRoom?.patientJoinedAt ? 1 : 0); // group: count primary as joined if room active
    const participantsJoined = secondaryJoined + primaryJoined;

    return {
      appointmentId: appt.id,
      patientName: appt.patient.name,
      scheduledAt: appt.scheduledAt,
      duration: appt.duration,
      status,
      roomId: appt.videoRoom?.id ?? null,
      participantCount,
      participantsJoined,
      participantNames: appt.participants.map((p) => p.patient.name),
    };
  });
}
```

- [ ] **Step 6: Update TodayVideoRoom DTO**

In `apps/api/src/video/dto/video.dto.ts`, update the `TodayVideoRoom` interface:

```typescript
export class TodayVideoRoom {
  appointmentId: string;
  patientName: string;
  scheduledAt: Date;
  duration: number;
  status: 'upcoming' | 'ready' | 'patient_waiting' | 'active' | 'ended';
  roomId: string | null;
  participantCount: number;
  participantsJoined: number;
  participantNames: string[];
}
```

- [ ] **Step 7: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/video/
git commit -m "feat(video): support multi-participant token generation, consent, room creation and session tracking"
```

---

## Task 4: Backend — Email Notifications for Participants

**Files:**
- Modify: `apps/api/src/notifications/email-sequence.service.ts`

- [ ] **Step 1: Update sendVideoLinks cron to include participants**

In `email-sequence.service.ts`, find the `sendVideoLinks()` method (around line 335). Modify the query to also fetch participants. The existing `sendVideoConsultationLink` signature is: `sendVideoConsultationLink(to: string, data: { patientName, psychologistName, scheduledAt, joinUrl })`.

```typescript
@Cron('*/5 * * * *')
async sendVideoLinks() {
  const tenMinFromNow = new Date(Date.now() + 10 * 60 * 1000);
  const now = new Date();

  // Find online appointments within 10 min that haven't sent video links
  const appointments = await this.prisma.appointment.findMany({
    where: {
      isOnline: true,
      scheduledAt: { gte: now, lte: tenMinFromNow },
      videoJoinToken: { not: null },
      videoLinkSentAt: null,
      status: { in: ['scheduled', 'confirmed'] },
    },
    include: {
      patient: { select: { name: true, email: true } },
      psychologist: { select: { name: true } },
      participants: {
        where: { videoLinkSentAt: null },
        include: { patient: { select: { name: true, email: true } } },
      },
    },
  });

  for (const appt of appointments) {
    // Send to primary patient (existing logic pattern)
    if (appt.patient.email) {
      const joinUrl = `${this.frontendUrl}/patient-portal/video/${appt.videoJoinToken}`;
      await this.email.sendVideoConsultationLink(appt.patient.email, {
        patientName: appt.patient.name,
        psychologistName: appt.psychologist.name,
        scheduledAt: appt.scheduledAt,
        joinUrl,
      });
    }

    await this.prisma.appointment.update({
      where: { id: appt.id },
      data: { videoLinkSentAt: new Date() },
    });

    // Send to additional participants
    for (const participant of appt.participants) {
      if (participant.patient.email && participant.videoJoinToken) {
        const participantJoinUrl = `${this.frontendUrl}/patient-portal/video/${participant.videoJoinToken}`;
        await this.email.sendVideoConsultationLink(participant.patient.email, {
          patientName: participant.patient.name,
          psychologistName: appt.psychologist.name,
          scheduledAt: appt.scheduledAt,
          joinUrl: participantJoinUrl,
        });

        await this.prisma.appointmentParticipant.update({
          where: { id: participant.id },
          data: { videoLinkSentAt: new Date() },
        });
      }
    }
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/notifications/
git commit -m "feat(notifications): send video links to all group appointment participants"
```

---

## Task 5: Frontend — Participant Multi-Select Component

**Files:**
- Create: `apps/web/src/components/calendar/participant-multi-select.tsx`
- Modify: `apps/web/src/components/calendar/create-appointment-dialog.tsx`

- [ ] **Step 1: Create the multi-select component**

Create `apps/web/src/components/calendar/participant-multi-select.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface Patient {
  id: string;
  name: string;
}

interface ParticipantMultiSelectProps {
  patients: Patient[];
  excludePatientId: string; // Primary patient to exclude
  selected: string[];
  onChange: (ids: string[]) => void;
  maxParticipants?: number;
}

export function ParticipantMultiSelect({
  patients,
  excludePatientId,
  selected,
  onChange,
  maxParticipants = 4,
}: ParticipantMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const availablePatients = patients.filter(
    (p) => p.id !== excludePatientId && !selected.includes(p.id),
  );

  const selectedPatients = patients.filter((p) => selected.includes(p.id));

  const handleSelect = (patientId: string) => {
    if (selected.length < maxParticipants) {
      onChange([...selected, patientId]);
    }
  };

  const handleRemove = (patientId: string) => {
    onChange(selected.filter((id) => id !== patientId));
  };

  return (
    <div className="space-y-2">
      {/* Selected participants as badges */}
      {selectedPatients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPatients.map((patient) => (
            <Badge key={patient.id} variant="secondary" className="gap-1 pr-1">
              {patient.name}
              <button
                type="button"
                onClick={() => handleRemove(patient.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add participant button */}
      {selected.length < maxParticipants && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Ajouter un participant ({selected.length}/{maxParticipants})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Rechercher un patient..." />
              <CommandList>
                <CommandEmpty>Aucun patient trouve.</CommandEmpty>
                <CommandGroup>
                  {availablePatients.map((patient) => (
                    <CommandItem
                      key={patient.id}
                      value={patient.name}
                      onSelect={() => {
                        handleSelect(patient.id);
                        setOpen(false);
                      }}
                    >
                      {patient.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Modify create-appointment-dialog.tsx to add participant picker**

In `apps/web/src/components/calendar/create-appointment-dialog.tsx`:

Add state for participants:
```tsx
const [participantIds, setParticipantIds] = useState<string[]>([]);
```

After the `isOnline` toggle (around the online checkbox area), add:
```tsx
{isOnline && patientId && (
  <div className="space-y-2">
    <label className="text-sm font-medium text-foreground">
      Participants supplementaires (optionnel)
    </label>
    <ParticipantMultiSelect
      patients={patients}
      excludePatientId={patientId}
      selected={participantIds}
      onChange={setParticipantIds}
    />
  </div>
)}
```

Modify the submit handler: if `participantIds.length > 0`, call `POST /appointments/group` instead of `POST /appointments`:

```tsx
const handleSubmit = async () => {
  if (isOnline && participantIds.length > 0) {
    await appointmentsApi.createGroup({
      patientId,
      participantIds,
      scheduledAt: selectedDateTime.toISOString(),
      duration,
      consultationTypeId: consultationTypeId || undefined,
    }, token);
  } else {
    await appointmentsApi.create({ /* existing logic */ }, token);
  }
  // ... rest of success handling
};
```

- [ ] **Step 3: Add createGroup to appointments API client**

In `apps/web/src/lib/api/appointments.ts` (or wherever `appointmentsApi` is defined), add:

```typescript
createGroup: (data: {
  patientId: string;
  participantIds: string[];
  scheduledAt: string;
  duration: number;
  consultationTypeId?: string;
}, token: string) =>
  apiClient.post('/appointments/group', data, token),
```

- [ ] **Step 4: Reset participantIds when patientId or isOnline changes**

Add effects:
```tsx
useEffect(() => { setParticipantIds([]); }, [patientId]);
useEffect(() => { if (!isOnline) setParticipantIds([]); }, [isOnline]);
```

- [ ] **Step 5: Verify TypeScript compilation**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/calendar/ apps/web/src/lib/api/
git commit -m "feat(web): add participant multi-select for group video appointments"
```

---

## Task 6: Frontend — Adaptive Video Grid

**Files:**
- Create: `apps/web/src/components/video/video-grid.tsx`
- Modify: `apps/web/src/components/video/video-room.tsx`

- [ ] **Step 1: Create the adaptive video grid component**

Create `apps/web/src/components/video/video-grid.tsx`:

```tsx
'use client';

import { VideoTrack, TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { User } from 'lucide-react';

interface VideoGridProps {
  remoteTracks: TrackReferenceOrPlaceholder[];
  localTrack: TrackReferenceOrPlaceholder | undefined;
}

function ParticipantTile({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  const name = trackRef.participant.name || 'Patient';

  if (!trackRef.publication) {
    return (
      <div className="relative flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-center text-white/60">
          <User className="h-12 w-12 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-gray-900">
      <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-xs text-white">
        {name}
      </div>
    </div>
  );
}

export function VideoGrid({ remoteTracks, localTrack }: VideoGridProps) {
  const count = remoteTracks.length;

  // Grid layout based on participant count
  // For 3 participants: use 3 cols so items center naturally
  const gridClass = (() => {
    switch (count) {
      case 0:
        return 'grid-cols-1 grid-rows-1';
      case 1:
        return 'grid-cols-1 grid-rows-1';
      case 2:
        return 'grid-cols-2 grid-rows-1';
      case 3:
        return 'grid-cols-3 grid-rows-1';
      case 4:
        return 'grid-cols-2 grid-rows-2';
      case 5:
        return 'grid-cols-3 grid-rows-2';
      default:
        return 'grid-cols-3 grid-rows-2';
    }
  })();

  return (
    <div className="relative w-full h-full">
      {count === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white/60">
            <User className="h-20 w-20 mx-auto mb-4 opacity-40" />
            <p className="text-lg">En attente des participants...</p>
          </div>
        </div>
      ) : (
        <div className={`grid ${gridClass} gap-2 h-full p-2`}>
          {remoteTracks.map((track) => (
            <ParticipantTile key={track.participant.identity} trackRef={track} />
          ))}
        </div>
      )}

      {/* Local (psy) PiP */}
      {localTrack?.publication && (
        <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg z-10">
          <VideoTrack trackRef={localTrack} className="w-full h-full object-cover" />
          <div className="absolute bottom-1 left-1 bg-black/50 px-1.5 py-0.5 rounded text-xs text-white">
            Vous
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update video-room.tsx to use VideoGrid**

Replace the video area in the `VideoLayout` component (the section between `{/* Remote participant */}` and `{/* Local participant PiP */}`) with the new grid:

```tsx
import { VideoGrid } from './video-grid';

// In VideoLayout, replace the video rendering section:
<div className="flex-1 relative bg-gray-900">
  {isReconnecting && (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
      <div className="text-white text-center">
        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
        <p>Reconnexion en cours...</p>
      </div>
    </div>
  )}

  <VideoGrid remoteTracks={remoteTracks} localTrack={localTrack} />
</div>
```

Remove the old remote participant rendering and local PiP code since VideoGrid handles both.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/video/
git commit -m "feat(web): adaptive video grid layout for multi-participant consultations"
```

---

## Task 7: Frontend — Today's Rooms Participant Display

**Files:**
- Modify: `apps/web/src/lib/api/video.ts`
- Modify: the component that renders today's video rooms (find it by searching for `getTodayRooms` usage)

- [ ] **Step 1: Update TodayRoom type in API client**

In `apps/web/src/lib/api/video.ts`, update the `TodayRoom` interface:

```typescript
export interface TodayRoom {
  appointmentId: string;
  patientName: string;
  scheduledAt: string;
  duration: number;
  status: 'upcoming' | 'ready' | 'patient_waiting' | 'active' | 'ended';
  roomId: string | null;
  participantCount: number;
  participantsJoined: number;
  participantNames: string[];
}
```

- [ ] **Step 2: Update the rooms list UI**

Find the component rendering today's rooms (likely in the video/visio page or dashboard widget). Add participant count display:

```tsx
{room.participantCount > 1 && (
  <Badge variant="outline" className="text-xs">
    {room.participantsJoined}/{room.participantCount} connectes
  </Badge>
)}
```

And show participant names as a tooltip or subtitle:
```tsx
{room.participantNames.length > 0 && (
  <p className="text-xs text-muted-foreground">
    + {room.participantNames.join(', ')}
  </p>
)}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): show participant count and names in today's video rooms"
```

---

## Task 8: Integration Testing

**Files:**
- Create: `apps/api/src/appointments/__tests__/group-appointment.spec.ts`
- Create: `apps/api/src/video/__tests__/video-group.spec.ts`

- [ ] **Step 1: Write group appointment creation tests**

Create `apps/api/src/appointments/__tests__/group-appointment.spec.ts`:

> Note: Project uses **vitest** (not jest). Use `vi.fn()` and import from `vitest`.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppointmentsService } from '../appointments.service';
import { BadRequestException } from '@nestjs/common';

describe('AppointmentsService - createGroup', () => {
  let service: AppointmentsService;
  let prisma: any;
  let audit: any;

  beforeEach(() => {
    prisma = {
      psychologist: { findUnique: vi.fn().mockResolvedValue({ id: 'psy-1', userId: 'user-1' }) },
      patient: { findMany: vi.fn() },
      appointment: { create: vi.fn() },
      appointmentParticipant: { createMany: vi.fn() },
    };
    audit = { log: vi.fn() };

    // Instantiate service directly with mocked dependencies (matches existing test pattern)
    service = new AppointmentsService(
      prisma,
      audit,
      {} as any, // emailService
      {} as any, // stripeService
      {} as any, // waitlistService
      {} as any, // notificationsService
      {} as any, // configService
    );
  });

  it('should reject duplicate patient IDs', async () => {
    await expect(
      service.createGroup('user-1', {
        patientId: 'patient-1',
        participantIds: ['patient-1', 'patient-2'],
        scheduledAt: new Date().toISOString(),
        duration: 60,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject if patient not owned by psy', async () => {
    prisma.patient.findMany.mockResolvedValue([{ id: 'patient-1' }]); // only 1 found

    await expect(
      service.createGroup('user-1', {
        patientId: 'patient-1',
        participantIds: ['patient-2'],
        scheduledAt: new Date().toISOString(),
        duration: 60,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create appointment with participant rows', async () => {
    prisma.patient.findMany.mockResolvedValue([
      { id: 'patient-1', email: 'a@b.com', name: 'A' },
      { id: 'patient-2', email: 'c@d.com', name: 'B' },
    ]);
    prisma.appointment.create.mockResolvedValue({
      id: 'appt-1',
      patientId: 'patient-1',
      isOnline: true,
      videoJoinToken: 'token-1',
    });
    prisma.appointmentParticipant.createMany.mockResolvedValue({ count: 1 });

    const result = await service.createGroup('user-1', {
      patientId: 'patient-1',
      participantIds: ['patient-2'],
      scheduledAt: new Date().toISOString(),
      duration: 60,
    });

    expect(result.participants).toHaveLength(1);
    expect(prisma.appointmentParticipant.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          appointmentId: 'appt-1',
          patientId: 'patient-2',
        }),
      ]),
    });
  });
});
```

- [ ] **Step 2: Write video group token generation tests**

Create `apps/api/src/video/__tests__/video-group.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoService } from '../video.service';
import { UnauthorizedException } from '@nestjs/common';

describe('VideoService - multi-participant', () => {
  let service: VideoService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      appointment: { findFirst: vi.fn() },
      appointmentParticipant: {
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
      },
      videoRoom: { update: vi.fn() },
      gdprConsent: { findFirst: vi.fn(), create: vi.fn() },
      psychologist: { findUnique: vi.fn() },
    };

    const configService = { get: (key: string, def?: string) => def || 'test-key' };
    const roomService = { createRoom: vi.fn(), deleteRoom: vi.fn(), listParticipants: vi.fn() };
    const audit = { log: vi.fn() };

    service = new VideoService(prisma, audit as any, roomService as any, configService as any);
  });

  it('should find participant by their token when primary token does not match', async () => {
    prisma.appointment.findFirst.mockResolvedValue(null); // primary token miss

    prisma.appointmentParticipant.findFirst.mockResolvedValue({
      patient: { id: 'patient-2', name: 'Participant B' },
      appointment: {
        id: 'appt-1',
        patientId: 'patient-1',
        duration: 60,
        videoRoom: { id: 'room-1', roomName: 'psylib-appt-1', status: 'active', patientJoinedAt: new Date() },
        psychologist: { name: 'Dr. Test' },
      },
    });

    prisma.gdprConsent.findFirst.mockResolvedValue({ id: 'consent-1' });
    prisma.videoRoom.update.mockResolvedValue({});
    prisma.appointmentParticipant.updateMany.mockResolvedValue({});

    const result = await service.generatePatientToken('participant-token-uuid');

    expect(result.token).toBeTruthy();
    expect(prisma.appointmentParticipant.findFirst).toHaveBeenCalledWith({
      where: { videoJoinToken: 'participant-token-uuid' },
      include: expect.anything(),
    });
  });

  it('should throw UnauthorizedException for invalid token', async () => {
    prisma.appointment.findFirst.mockResolvedValue(null);
    prisma.appointmentParticipant.findFirst.mockResolvedValue(null);

    await expect(service.generatePatientToken('bad-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should check GDPR consent for the specific participant', async () => {
    prisma.appointment.findFirst.mockResolvedValue(null);
    prisma.appointmentParticipant.findFirst.mockResolvedValue({
      patient: { id: 'patient-2', name: 'B' },
      appointment: {
        id: 'appt-1',
        patientId: 'patient-1',
        duration: 60,
        videoRoom: { id: 'room-1', roomName: 'r', status: 'active', patientJoinedAt: null },
        psychologist: { name: 'Dr.' },
      },
    });

    prisma.gdprConsent.findFirst.mockResolvedValue(null); // no consent

    const result = await service.generatePatientToken('p2-token');

    expect(result.needsConsent).toBe(true);
    expect(prisma.gdprConsent.findFirst).toHaveBeenCalledWith({
      where: { patientId: 'patient-2', type: 'video_consultation', withdrawnAt: null },
    });
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd apps/api && npx vitest run src/appointments/__tests__/group-appointment.spec.ts src/video/__tests__/video-group.spec.ts`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/appointments/__tests__/ apps/api/src/video/__tests__/
git commit -m "test: add unit tests for group appointment creation and multi-participant video tokens"
```

---

## Task 9: Final Verification & Deploy

- [ ] **Step 1: Full TypeScript check**

Run: `cd apps/api && npx tsc --noEmit && cd ../web && npx tsc --noEmit`
Expected: No errors in either project

- [ ] **Step 2: Run all existing tests**

Run: `cd apps/api && npx vitest run`
Expected: All tests pass (no regressions)

- [ ] **Step 3: Test manually**

1. Create a group appointment via API: `POST /appointments/group` with 2-3 patients
2. Verify `appointment_participants` rows created with tokens
3. Create room, generate psy token, generate patient tokens for primary + secondary
4. Verify GDPR consent gate works per participant
5. End room, verify session created with `type: 'group'` and `participantIds`

- [ ] **Step 4: Final commit with any fixes**

```bash
git add apps/api/ apps/web/ packages/shared-types/
git commit -m "feat: multi-participant video consultations (couple/family therapy)"
```
