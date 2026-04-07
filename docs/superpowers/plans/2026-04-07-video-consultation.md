# Video Consultation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 1-to-1 video consultation to PsyLib using LiveKit self-hosted on OVH HDS — zero third-party cost, full HDS compliance.

**Architecture:** LiveKit SFU (Docker, OVH HDS) handles WebRTC media. NestJS `VideoModule` manages rooms/tokens. Next.js frontend uses `@livekit/components-react` for the call UI. Patient joins via a unique token link (no login required). Notes panel during call reuses existing `session-note-editor`.

**Tech Stack:** LiveKit Server (Docker), `livekit-server-sdk` (NestJS), `@livekit/components-react` + `livekit-client` (Next.js), Prisma migration, Resend email.

**Spec:** `docs/superpowers/specs/2026-04-07-video-consultation-design.md`

---

## File Structure

### New files to create

```
apps/api/src/video/
├── video.module.ts                 # NestJS module registration
├── video.controller.ts             # REST endpoints for rooms/tokens
├── video.service.ts                # Room lifecycle, token generation, cleanup
├── dto/
│   └── video.dto.ts                # CreateVideoRoomDto, VideoTokenResponseDto
└── __tests__/
    └── video.service.spec.ts       # Unit tests (Vitest)

apps/web/src/
├── app/(dashboard)/video/
│   ├── page.tsx                    # List today's video consultations
│   └── [roomId]/page.tsx           # Psy consultation room (video + notes panel)
├── app/(patient-portal)/video/
│   └── [token]/page.tsx            # Patient waiting room + call
├── components/video/
│   ├── video-room.tsx              # LiveKit room wrapper (psy view)
│   ├── patient-video-room.tsx      # LiveKit room wrapper (patient view)
│   ├── video-controls.tsx          # Mic/camera/timer/end controls
│   ├── waiting-room.tsx            # Patient waiting screen with media preview
│   ├── video-consent-screen.tsx    # GDPR consent before first video call
│   └── session-timer.tsx           # Elapsed time display
├── hooks/
│   └── use-video-call.ts           # Custom hook wrapping LiveKit hooks
└── lib/api/
    └── video.ts                    # API client functions for video endpoints

packages/shared-types/src/index.ts  # Add VideoRoomStatus, GdprConsentType.VIDEO, AuditAction.VIDEO_*
```

### Existing files to modify

```
apps/api/prisma/schema.prisma                              # Add VideoRoom model, Appointment.isOnline/videoJoinToken
apps/api/src/appointments/dto/appointment.dto.ts            # Add isOnline to CreateAppointmentDto
apps/api/src/appointments/appointments.service.ts           # Generate videoJoinToken when isOnline
apps/api/src/billing/decorators/require-plan.decorator.ts   # Add 'video' to BillingFeature
apps/api/src/notifications/email.service.ts                 # Add sendVideoConsultationLink method
apps/api/src/notifications/email-sequence.service.ts        # Add video link cron check
apps/api/src/common/audit.service.ts                         # Extend AuditAction type with VIDEO_* actions
apps/api/src/app.module.ts                                  # Import VideoModule

apps/web/src/middleware.ts                                  # Whitelist /patient-portal/video/*
apps/web/next.config.mjs                                   # CSP connect-src + Permissions-Policy
apps/web/src/components/layouts/sidebar.tsx                 # Add "Visio" nav item
apps/web/src/components/calendar/calendar-content.tsx       # Video badge + "Démarrer" button
apps/web/src/components/calendar/create-appointment-dialog.tsx  # "Consultation en visio" checkbox
```

---

## Task 1: Shared Types & Prisma Migration

**Files:**
- Modify: `packages/shared-types/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add shared types for video**

In `packages/shared-types/src/index.ts`, add:

```typescript
// After existing AuditAction enum (~line 95)
// Add to AuditAction:
  VIDEO_ROOM_CREATED = 'VIDEO_ROOM_CREATED',
  VIDEO_PSY_JOIN = 'VIDEO_PSY_JOIN',
  VIDEO_PATIENT_JOIN = 'VIDEO_PATIENT_JOIN',
  VIDEO_CALL_END = 'VIDEO_CALL_END',
  VIDEO_ROOM_CLEANUP = 'VIDEO_ROOM_CLEANUP',

// Add to GdprConsentType enum (~line 100):
  VIDEO_CONSULTATION = 'video_consultation',

// Add new enum after existing enums:
export enum VideoRoomStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  ENDED = 'ended',
}

// Add to BillingFeature concept — extend PLAN_LIMITS:
// In PLAN_LIMITS, add videoConsultations field:
//   free: { ..., videoConsultations: 0 },
//   starter: { ..., videoConsultations: 0 },
//   pro: { ..., videoConsultations: null },  // unlimited
//   clinic: { ..., videoConsultations: null },
```

- [ ] **Step 2: Add Prisma schema changes**

In `apps/api/prisma/schema.prisma`:

Add the `VideoRoomStatus` enum after existing enums (~line 145):

```prisma
enum VideoRoomStatus {
  waiting
  active
  ended
}
```

Add fields to `Appointment` model (after `bookingPaymentStatus` field, ~line 521):

```prisma
  isOnline             Boolean              @default(false) @map("is_online")
  videoJoinToken       String?              @unique @map("video_join_token")
  videoLinkSentAt      DateTime?            @map("video_link_sent_at")
  videoRoom            VideoRoom?
```

Add `VideoRoom` model after `Appointment` model:

```prisma
model VideoRoom {
  id              String          @id @default(uuid())
  appointmentId   String          @unique @map("appointment_id")
  appointment     Appointment     @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  psychologistId  String          @map("psychologist_id")
  psychologist    Psychologist    @relation(fields: [psychologistId], references: [id])
  roomName        String          @unique @map("room_name")
  status          VideoRoomStatus @default(waiting)
  psyJoinedAt     DateTime?       @map("psy_joined_at")
  patientJoinedAt DateTime?       @map("patient_joined_at")
  endedAt         DateTime?       @map("ended_at")
  createdAt       DateTime        @default(now()) @map("created_at")

  @@index([psychologistId, status])
  @@index([appointmentId])
  @@map("video_rooms")
}
```

Add `videoRooms VideoRoom[]` to the `Psychologist` model relations.

- [ ] **Step 3: Run migration**

```bash
cd apps/api && npx prisma migrate dev --name add-video-rooms
```

Expected: Migration creates `video_rooms` table + adds `is_online`, `video_join_token`, `video_link_sent_at` columns to `appointments`.

- [ ] **Step 4: Verify Prisma client generation**

```bash
cd apps/api && npx prisma generate
```

Expected: No errors. `PrismaClient` now has `videoRoom` model.

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types/src/index.ts apps/api/prisma/
git commit -m "feat(video): add shared types and Prisma migration for video rooms"
```

---

## Task 2: NestJS VideoService (Core Logic)

**Files:**
- Create: `apps/api/src/video/video.service.ts`
- Create: `apps/api/src/video/dto/video.dto.ts`
- Create: `apps/api/src/video/__tests__/video.service.spec.ts`

**Dependencies:** `npm install livekit-server-sdk` in `apps/api/`

- [ ] **Step 1: Install livekit-server-sdk**

```bash
cd apps/api && npm install livekit-server-sdk
```

- [ ] **Step 2: Create DTOs**

Create `apps/api/src/video/dto/video.dto.ts`:

```typescript
import { IsString, IsUUID } from 'class-validator';

export class CreateVideoRoomDto {
  @IsUUID()
  appointmentId!: string;
}

export interface VideoTokenResponse {
  token: string;
  wsUrl: string;
  roomName: string;
}

export interface VideoRoomResponse {
  id: string;
  appointmentId: string;
  roomName: string;
  status: string;
  psyJoinedAt: Date | null;
  patientJoinedAt: Date | null;
  createdAt: Date;
}

export interface TodayVideoRoom {
  appointmentId: string;
  patientName: string;
  scheduledAt: Date;
  duration: number;
  status: 'upcoming' | 'ready' | 'patient_waiting' | 'active' | 'ended';
  roomId: string | null;
}
```

- [ ] **Step 3: Write failing tests for VideoService**

Create `apps/api/src/video/__tests__/video.service.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoService } from '../video.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

// Mocks
const mockPrisma = {
  psychologist: { findUnique: vi.fn() },
  appointment: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  videoRoom: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  gdprConsent: { findFirst: vi.fn(), create: vi.fn() },
  session: { create: vi.fn() },
};
const mockAudit = { log: vi.fn() };
const mockLivekitRoomService = {
  createRoom: vi.fn(),
  deleteRoom: vi.fn(),
  listParticipants: vi.fn(),
};

const PSY_USER_ID = 'user-psy-1';
const PSY_ID = 'psy-1';
const PATIENT_ID = 'patient-1';
const APPOINTMENT_ID = 'appt-1';
const ROOM_ID = 'room-1';

const mockPsychologist = { id: PSY_ID, userId: PSY_USER_ID, name: 'Dr. Test' };

function makeAppointment(overrides = {}) {
  return {
    id: APPOINTMENT_ID,
    psychologistId: PSY_ID,
    patientId: PATIENT_ID,
    scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min from now
    duration: 50,
    status: 'scheduled',
    isOnline: true,
    videoJoinToken: 'join-token-123',
    videoRoom: null,
    patient: { id: PATIENT_ID, name: 'Marie Dupont', email: 'marie@test.com' },
    ...overrides,
  };
}

function makeVideoRoom(overrides = {}) {
  return {
    id: ROOM_ID,
    appointmentId: APPOINTMENT_ID,
    psychologistId: PSY_ID,
    roomName: `psylib-${APPOINTMENT_ID}`,
    status: 'waiting',
    psyJoinedAt: null,
    patientJoinedAt: null,
    endedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function createService(): VideoService {
  return new VideoService(
    mockPrisma as never,
    mockAudit as never,
    mockLivekitRoomService as never,
  );
}

let service: VideoService;

beforeEach(() => {
  vi.clearAllMocks();
  service = createService();
});

describe('VideoService', () => {
  describe('createRoom()', () => {
    it('should create a LiveKit room and persist VideoRoom', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(makeAppointment());
      mockLivekitRoomService.createRoom.mockResolvedValueOnce({ name: `psylib-${APPOINTMENT_ID}` });
      mockPrisma.videoRoom.create.mockResolvedValueOnce(makeVideoRoom());

      const result = await service.createRoom(PSY_USER_ID, APPOINTMENT_ID);

      expect(result).toEqual(expect.objectContaining({ roomName: `psylib-${APPOINTMENT_ID}` }));
      expect(mockLivekitRoomService.createRoom).toHaveBeenCalledOnce();
      expect(mockPrisma.videoRoom.create).toHaveBeenCalledOnce();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'VIDEO_ROOM_CREATED' }));
    });

    it('should throw if appointment is not isOnline', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(makeAppointment({ isOnline: false }));

      await expect(service.createRoom(PSY_USER_ID, APPOINTMENT_ID))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw if appointment does not belong to psy', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);

      await expect(service.createRoom(PSY_USER_ID, APPOINTMENT_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw if outside the 10-min window', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      // Appointment 2 hours from now — outside the 10-min window
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(
        makeAppointment({ scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000) }),
      );

      await expect(service.createRoom(PSY_USER_ID, APPOINTMENT_ID))
        .rejects.toThrow(BadRequestException);
    });

    it('should return existing room if already created (idempotent)', async () => {
      const existingRoom = makeVideoRoom();
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(makeAppointment({ videoRoom: existingRoom }));

      const result = await service.createRoom(PSY_USER_ID, APPOINTMENT_ID);

      expect(result).toEqual(existingRoom);
      expect(mockLivekitRoomService.createRoom).not.toHaveBeenCalled();
    });
  });

  describe('generatePsyToken()', () => {
    it('should generate a LiveKit access token for the psy', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.videoRoom.findFirst.mockResolvedValueOnce(makeVideoRoom());
      mockPrisma.videoRoom.update.mockResolvedValueOnce(makeVideoRoom({ psyJoinedAt: new Date() }));

      const result = await service.generatePsyToken(PSY_USER_ID, APPOINTMENT_ID);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('wsUrl');
      expect(result).toHaveProperty('roomName');
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'VIDEO_PSY_JOIN' }));
    });
  });

  describe('generatePatientToken()', () => {
    it('should generate a token for the patient via joinToken', async () => {
      const appt = makeAppointment();
      const room = makeVideoRoom();
      mockPrisma.appointment.findFirst.mockResolvedValueOnce({ ...appt, videoRoom: room });
      mockPrisma.gdprConsent.findFirst.mockResolvedValueOnce({ id: 'consent-1' }); // has consent
      mockPrisma.videoRoom.update.mockResolvedValueOnce({ ...room, patientJoinedAt: new Date() });

      const result = await service.generatePatientToken('join-token-123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('wsUrl');
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'VIDEO_PATIENT_JOIN' }));
    });

    it('should return needsConsent if no GDPR consent', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValueOnce({ ...makeAppointment(), videoRoom: makeVideoRoom() });
      mockPrisma.gdprConsent.findFirst.mockResolvedValueOnce(null); // no consent

      const result = await service.generatePatientToken('join-token-123');

      expect(result).toEqual(expect.objectContaining({ needsConsent: true }));
    });

    it('should throw if joinToken is invalid', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);

      await expect(service.generatePatientToken('invalid-token'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw if room is ended', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValueOnce({
        ...makeAppointment(),
        videoRoom: makeVideoRoom({ status: 'ended' }),
      });

      await expect(service.generatePatientToken('join-token-123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('endRoom()', () => {
    it('should end the room, update appointment, create session', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      const room = makeVideoRoom({ status: 'active', psyJoinedAt: new Date(Date.now() - 50 * 60 * 1000) });
      mockPrisma.videoRoom.findFirst.mockResolvedValueOnce(room);
      mockLivekitRoomService.deleteRoom.mockResolvedValueOnce(undefined);
      mockPrisma.videoRoom.update.mockResolvedValueOnce({ ...room, status: 'ended', endedAt: new Date() });
      mockPrisma.appointment.update.mockResolvedValueOnce({ ...makeAppointment(), status: 'completed' });
      mockPrisma.session.create.mockResolvedValueOnce({ id: 'session-1' });

      await service.endRoom(PSY_USER_ID, APPOINTMENT_ID);

      expect(mockLivekitRoomService.deleteRoom).toHaveBeenCalledOnce();
      expect(mockPrisma.videoRoom.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'ended' }),
      }));
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'completed' }),
      }));
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'VIDEO_CALL_END' }));
    });
  });

    it('should skip session creation if appointment already has a session', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      const room = makeVideoRoom({ status: 'active', psyJoinedAt: new Date(Date.now() - 50 * 60 * 1000) });
      mockPrisma.videoRoom.findFirst.mockResolvedValueOnce({
        ...room,
        appointment: { ...makeAppointment(), sessionId: 'existing-session-id' },
      });
      mockLivekitRoomService.deleteRoom.mockResolvedValueOnce(undefined);
      mockPrisma.videoRoom.update.mockResolvedValueOnce({ ...room, status: 'ended' });
      mockPrisma.appointment.update.mockResolvedValueOnce({});

      await service.endRoom(PSY_USER_ID, APPOINTMENT_ID);

      expect(mockPrisma.session.create).not.toHaveBeenCalled();
    });
  });

  describe('cleanupOrphanedRooms()', () => {
    it('should close rooms active for >15 min with no participants', async () => {
      const orphanedRoom = makeVideoRoom({
        status: 'active',
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      });
      mockPrisma.videoRoom.findMany.mockResolvedValueOnce([orphanedRoom]);
      mockLivekitRoomService.listParticipants.mockResolvedValueOnce([]);
      mockLivekitRoomService.deleteRoom.mockResolvedValueOnce(undefined);
      mockPrisma.videoRoom.update.mockResolvedValueOnce({ ...orphanedRoom, status: 'ended' });

      await service.cleanupOrphanedRooms();

      expect(mockPrisma.videoRoom.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'ended' }),
      }));
    });
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
cd apps/api && npx vitest run src/video/__tests__/video.service.spec.ts
```

Expected: FAIL — `Cannot find module '../video.service'`

- [ ] **Step 5: Implement VideoService**

Create `apps/api/src/video/video.service.ts`:

```typescript
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { RoomServiceClient, AccessToken, VideoGrant } from 'livekit-server-sdk';
import { Cron } from '@nestjs/schedule';
import { VideoTokenResponse, TodayVideoRoom } from './dto/video.dto';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly livekitApiKey = process.env.LIVEKIT_API_KEY!;
  private readonly livekitApiSecret = process.env.LIVEKIT_API_SECRET!;
  private readonly livekitWsUrl = process.env.LIVEKIT_WS_URL!;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly roomService: RoomServiceClient,
  ) {}

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }

  async createRoom(userId: string, appointmentId: string) {
    const psy = await this.getPsychologist(userId);

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, psychologistId: psy.id },
      include: { videoRoom: true, patient: { select: { name: true, email: true } } },
    });

    if (!appointment) throw new NotFoundException('Rendez-vous introuvable');
    if (!appointment.isOnline) throw new BadRequestException("Ce rendez-vous n'est pas en visio");
    if (['cancelled', 'completed'].includes(appointment.status)) {
      throw new BadRequestException('Ce rendez-vous est annulé ou terminé');
    }

    // Idempotent: return existing room
    if (appointment.videoRoom) return appointment.videoRoom;

    // Check time window: 10 min before to end of appointment
    const now = new Date();
    const windowStart = new Date(appointment.scheduledAt.getTime() - 10 * 60 * 1000);
    const windowEnd = new Date(appointment.scheduledAt.getTime() + appointment.duration * 60 * 1000);
    if (now < windowStart || now > windowEnd) {
      throw new BadRequestException('La visio ne peut être démarrée que 10 min avant le RDV');
    }

    const roomName = `psylib-${appointmentId}`;
    await this.roomService.createRoom({ name: roomName, emptyTimeout: 300 });

    const videoRoom = await this.prisma.videoRoom.create({
      data: {
        appointmentId,
        psychologistId: psy.id,
        roomName,
        status: 'waiting',
      },
    });

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'VIDEO_ROOM_CREATED',
      entityType: 'video_room',
      entityId: videoRoom.id,
      metadata: { appointmentId },
    });

    return videoRoom;
  }

  async generatePsyToken(userId: string, appointmentId: string): Promise<VideoTokenResponse> {
    const psy = await this.getPsychologist(userId);

    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
      include: { appointment: true },
    });

    if (!room) throw new NotFoundException('Salle de visio introuvable');
    if (room.status === 'ended') throw new BadRequestException('Cette consultation est terminée');

    const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
      identity: `psy-${psy.id}`,
      name: psy.name || 'Psychologue',
      ttl: (room.appointment.duration + 30) * 60, // seconds
    });
    const grant: VideoGrant = {
      room: room.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    };
    token.addGrant(grant);

    // Mark psy joined
    if (!room.psyJoinedAt) {
      await this.prisma.videoRoom.update({
        where: { id: room.id },
        data: { psyJoinedAt: new Date(), status: 'active' },
      });
    }

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'VIDEO_PSY_JOIN',
      entityType: 'video_room',
      entityId: room.id,
    });

    return {
      token: await token.toJwt(),
      wsUrl: this.livekitWsUrl,
      roomName: room.roomName,
    };
  }

  async generatePatientToken(joinToken: string): Promise<VideoTokenResponse & { needsConsent?: boolean }> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { videoJoinToken: joinToken },
      include: {
        videoRoom: true,
        patient: { select: { id: true, name: true } },
        psychologist: { select: { name: true } },
      },
    });

    if (!appointment) throw new UnauthorizedException('Lien de visio invalide ou expiré');
    if (!appointment.videoRoom) throw new BadRequestException('La salle de visio n\'est pas encore prête');
    if (appointment.videoRoom.status === 'ended') throw new BadRequestException('Cette consultation est terminée');

    // Check GDPR consent
    const consent = await this.prisma.gdprConsent.findFirst({
      where: {
        patientId: appointment.patientId,
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
        patientName: appointment.patient.name,
        psychologistName: appointment.psychologist.name,
      } as any;
    }

    const room = appointment.videoRoom;
    const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
      identity: `patient-${appointment.patientId}`,
      name: appointment.patient.name || 'Patient',
      ttl: (appointment.duration + 30) * 60,
    });
    const grant: VideoGrant = {
      room: room.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    };
    token.addGrant(grant);

    if (!room.patientJoinedAt) {
      await this.prisma.videoRoom.update({
        where: { id: room.id },
        data: { patientJoinedAt: new Date(), status: 'active' },
      });
    }

    await this.audit.log({
      actorId: appointment.patientId,
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

  async recordConsent(joinToken: string, ipAddress?: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { videoJoinToken: joinToken },
    });
    if (!appointment) throw new UnauthorizedException('Lien invalide');

    await this.prisma.gdprConsent.create({
      data: {
        patientId: appointment.patientId,
        type: 'video_consultation',
        version: '2026-04-v1',
        ipAddress,
      },
    });
  }

  async endRoom(userId: string, appointmentId: string): Promise<void> {
    const psy = await this.getPsychologist(userId);

    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
      include: { appointment: true },
    });

    if (!room) throw new NotFoundException('Salle de visio introuvable');

    // Close LiveKit room
    try {
      await this.roomService.deleteRoom(room.roomName);
    } catch (e) {
      this.logger.warn(`Failed to delete LiveKit room ${room.roomName}: ${e}`);
    }

    // Calculate duration
    const startTime = room.psyJoinedAt || room.createdAt;
    const durationMinutes = Math.round((Date.now() - startTime.getTime()) / 60000);

    // Update room status
    await this.prisma.videoRoom.update({
      where: { id: room.id },
      data: { status: 'ended', endedAt: new Date() },
    });

    // Update appointment status
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'completed' },
    });

    // Auto-create session if none linked
    if (!room.appointment.sessionId) {
      const session = await this.prisma.session.create({
        data: {
          patientId: room.appointment.patientId,
          psychologistId: psy.id,
          date: startTime,
          duration: durationMinutes,
          type: 'online',
          notes: '',
          paymentStatus: 'pending',
        },
      });
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { sessionId: session.id },
      });
    }

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'VIDEO_CALL_END',
      entityType: 'video_room',
      entityId: room.id,
      metadata: { durationMinutes },
    });
  }

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

      return {
        appointmentId: appt.id,
        patientName: appt.patient.name,
        scheduledAt: appt.scheduledAt,
        duration: appt.duration,
        status,
        roomId: appt.videoRoom?.id ?? null,
      };
    });
  }

  async getRoomInfo(userId: string, appointmentId: string) {
    const psy = await this.getPsychologist(userId);
    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
      include: { appointment: { select: { scheduledAt: true, duration: true, patientId: true } } },
    });
    if (!room) throw new NotFoundException('Salle de visio introuvable');
    return room;
  }

  @Cron('*/5 * * * *') // Every 5 minutes
  async cleanupOrphanedRooms(): Promise<void> {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

    const orphanedRooms = await this.prisma.videoRoom.findMany({
      where: {
        status: { in: ['waiting', 'active'] },
        createdAt: { lt: fifteenMinAgo },
      },
    });

    for (const room of orphanedRooms) {
      try {
        const participants = await this.roomService.listParticipants(room.roomName);
        if (participants.length === 0) {
          await this.roomService.deleteRoom(room.roomName);
          await this.prisma.videoRoom.update({
            where: { id: room.id },
            data: { status: 'ended', endedAt: new Date() },
          });
          await this.audit.log({
            actorId: 'system',
            actorType: 'system',
            action: 'VIDEO_ROOM_CLEANUP',
            entityType: 'video_room',
            entityId: room.id,
          });
          this.logger.log(`Cleaned up orphaned room ${room.roomName}`);
        }
      } catch {
        // Room may not exist in LiveKit anymore
        await this.prisma.videoRoom.update({
          where: { id: room.id },
          data: { status: 'ended', endedAt: new Date() },
        });
      }
    }
  }
}
```

**Additional implementation notes for the implementer:**

1. **Extend local `AuditAction` type** in `apps/api/src/common/audit.service.ts` — add `'VIDEO_ROOM_CREATED' | 'VIDEO_PSY_JOIN' | 'VIDEO_PATIENT_JOIN' | 'VIDEO_CALL_END' | 'VIDEO_ROOM_CLEANUP'` to the `AuditAction` union type.

2. **Use `ConfigService`** instead of `process.env` — inject `ConfigService` from `@nestjs/config` and use `this.config.get<string>('LIVEKIT_API_KEY')` etc. This is consistent with the existing codebase pattern.

3. **Pass IP address** to audit logs for `VIDEO_PSY_JOIN` and `VIDEO_PATIENT_JOIN` — the controller should pass `@Req() req: Request` and the service should accept an optional `ip?: string` parameter.
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd apps/api && npx vitest run src/video/__tests__/video.service.spec.ts
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/video/ apps/api/package.json apps/api/package-lock.json
git commit -m "feat(video): add VideoService with room lifecycle and token generation"
```

---

## Task 3: NestJS VideoController & Module

**Files:**
- Create: `apps/api/src/video/video.controller.ts`
- Create: `apps/api/src/video/video.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/billing/decorators/require-plan.decorator.ts`

- [ ] **Step 1: Add 'video' to BillingFeature**

In `apps/api/src/billing/decorators/require-plan.decorator.ts`, change:

```typescript
export type BillingFeature = 'patients' | 'sessions' | 'ai_summary';
```

to:

```typescript
export type BillingFeature = 'patients' | 'sessions' | 'ai_summary' | 'video';
```

- [ ] **Step 2: Create VideoController**

Create `apps/api/src/video/video.controller.ts`:

```typescript
import {
  Controller, Post, Get, Param, Body, UseGuards, Req, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequirePlan } from '../billing/decorators/require-plan.decorator';
import { SubscriptionPlan } from '@psyscale/shared-types';
import { VideoService } from './video.service';
import { CreateVideoRoomDto } from './dto/video.dto';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

@ApiTags('Video')
@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  // --- Protected endpoints (psy only, plan-gated) ---

  @Post('rooms')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async createRoom(
    @Body() dto: CreateVideoRoomDto,
    @CurrentUser() user: any,
  ) {
    return this.videoService.createRoom(user.sub, dto.appointmentId);
  }

  @Get('rooms/:appointmentId')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async getRoom(@Param('appointmentId') appointmentId: string, @CurrentUser() user: any) {
    return this.videoService.getRoomInfo(user.sub, appointmentId);
  }

  @Post('rooms/:appointmentId/token')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async getPsyToken(@Param('appointmentId') appointmentId: string, @CurrentUser() user: any) {
    return this.videoService.generatePsyToken(user.sub, appointmentId);
  }

  @Get('today')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async getTodayRooms(@CurrentUser() user: any) {
    return this.videoService.getTodayRooms(user.sub);
  }

  @Post('rooms/:appointmentId/end')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @HttpCode(204)
  async endRoom(@Param('appointmentId') appointmentId: string, @CurrentUser() user: any) {
    await this.videoService.endRoom(user.sub, appointmentId);
  }

  // --- Public endpoints (patient, rate limited) ---

  @Post('join/:token')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async joinAsPatient(@Param('token') token: string) {
    return this.videoService.generatePatientToken(token);
  }

  @Post('consent/:token')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async recordConsent(@Param('token') token: string, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    await this.videoService.recordConsent(token, ip);
    return { ok: true };
  }
}
```

- [ ] **Step 3: Create VideoModule**

Create `apps/api/src/video/video.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { RoomServiceClient } from 'livekit-server-sdk';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [VideoController],
  providers: [
    VideoService,
    {
      provide: RoomServiceClient,
      useFactory: () => {
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const host = process.env.LIVEKIT_API_URL || 'http://localhost:7880';
        return new RoomServiceClient(host, apiKey, apiSecret);
      },
    },
  ],
  exports: [VideoService],
})
export class VideoModule {}
```

- [ ] **Step 4: Register VideoModule in AppModule**

In `apps/api/src/app.module.ts`, add import:

```typescript
import { VideoModule } from './video/video.module';
```

And add `VideoModule` to the `imports` array.

- [ ] **Step 5: Verify build**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/video/ apps/api/src/app.module.ts apps/api/src/billing/decorators/require-plan.decorator.ts
git commit -m "feat(video): add VideoController, VideoModule with plan gating"
```

---

## Task 4: Appointment Modification (isOnline + videoJoinToken)

**Files:**
- Modify: `apps/api/src/appointments/dto/appointment.dto.ts`
- Modify: `apps/api/src/appointments/appointments.service.ts`

- [ ] **Step 1: Add isOnline to CreateAppointmentDto**

In `apps/api/src/appointments/dto/appointment.dto.ts`, add to `CreateAppointmentDto`:

```typescript
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Add to CreateAppointmentDto:
@ApiPropertyOptional({ default: false })
@IsBoolean()
@IsOptional()
isOnline?: boolean;
```

- [ ] **Step 2: Generate videoJoinToken in create()**

In `apps/api/src/appointments/appointments.service.ts`, modify the `create()` method.

Add `import { randomUUID } from 'crypto';` at top.

In the `create()` method, update the `data` object to include:

```typescript
isOnline: dto.isOnline ?? false,
videoJoinToken: dto.isOnline ? randomUUID() : undefined,
```

- [ ] **Step 3: Run existing tests**

```bash
cd apps/api && npx vitest run src/appointments/__tests__/appointments.service.spec.ts
```

Expected: All existing tests still PASS (isOnline defaults to false).

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/appointments/
git commit -m "feat(video): add isOnline field to appointment creation"
```

---

## Task 5: Email Notification + Cron Job

**Files:**
- Modify: `apps/api/src/notifications/email.service.ts`
- Modify: `apps/api/src/notifications/email-sequence.service.ts`

- [ ] **Step 1: Add sendVideoConsultationLink to EmailService**

In `apps/api/src/notifications/email.service.ts`, add a new method:

```typescript
async sendVideoConsultationLink(
  to: string,
  data: {
    patientName: string;
    psychologistName: string;
    scheduledAt: Date;
    joinUrl: string;
  },
): Promise<void> {
  const dateFormatted = data.scheduledAt.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const timeFormatted = data.scheduledAt.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  });

  const html = emailLayout(
    'Votre consultation vidéo',
    `<h1>Bonjour ${data.patientName},</h1>
     <p>Votre consultation vidéo avec <strong>${data.psychologistName}</strong> commence bientôt.</p>
     <div class="info-box">
       <strong>📅 ${dateFormatted}</strong> à <strong>${timeFormatted}</strong>
     </div>
     <p style="text-align: center; margin: 24px 0;">
       <a href="${data.joinUrl}" class="btn">Rejoindre la consultation</a>
     </p>
     <p>Aucune application à installer — le lien s'ouvre dans votre navigateur.</p>
     <div class="info-box">
       <strong>Conseils :</strong><br />
       • Installez-vous dans un endroit calme et privé<br />
       • Vérifiez que votre micro et caméra fonctionnent<br />
       • Utilisez Chrome, Firefox ou Safari à jour
     </div>
     <p>En cas de problème technique, contactez votre psychologue.</p>`,
  );

  await this.send(to, `Consultation vidéo — ${dateFormatted} à ${timeFormatted}`, html, 'sendVideoConsultationLink');
}
```

- [ ] **Step 2: Add video link cron in email-sequence.service.ts**

In `apps/api/src/notifications/email-sequence.service.ts`, add a new cron method:

```typescript
@Cron('*/5 * * * *', { timeZone: 'Europe/Paris' })  // Every 5 minutes
async sendVideoLinks(): Promise<void> {
  const now = new Date();
  const inTenMin = new Date(now.getTime() + 10 * 60 * 1000);

  // Find online appointments in the next 10 minutes that haven't had video link sent
  const appointments = await this.prisma.appointment.findMany({
    where: {
      isOnline: true,
      videoJoinToken: { not: null },
      videoLinkSentAt: null,
      scheduledAt: { lte: inTenMin, gt: now },
      status: { in: ['scheduled', 'confirmed'] },
    },
    include: {
      patient: { select: { name: true, email: true } },
      psychologist: { select: { name: true } },
    },
  });

  const appUrl = process.env.APP_URL || 'https://psylib.eu';

  for (const appt of appointments) {
    if (!appt.patient.email) continue;
    const joinUrl = `${appUrl}/patient-portal/video/${appt.videoJoinToken}`;

    await this.email.sendVideoConsultationLink(appt.patient.email, {
      patientName: appt.patient.name,
      psychologistName: appt.psychologist.name,
      scheduledAt: appt.scheduledAt,
      joinUrl,
    });

    await this.prisma.appointment.update({
      where: { id: appt.id },
      data: { videoLinkSentAt: new Date() },
    });
  }
}
```

- [ ] **Step 3: Verify build**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/notifications/
git commit -m "feat(video): add video link email notification with cron scheduling"
```

---

## Task 6: Frontend — CSP, Middleware, Sidebar

**Files:**
- Modify: `apps/web/next.config.mjs`
- Modify: `apps/web/src/middleware.ts`
- Modify: `apps/web/src/components/layouts/sidebar.tsx`

- [ ] **Step 1: Update CSP in next.config.mjs**

In `apps/web/next.config.mjs`:

Add `${process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || ''}` to the `connect-src` directive.

Change `camera=()` to `camera=(self)` and `microphone=()` to `microphone=(self)` in the `Permissions-Policy` header.

- [ ] **Step 2: Add public video route in middleware.ts**

In `apps/web/src/middleware.ts`, add to the public route checks (before the protected routes check):

```typescript
// Video consultation — patient joins via token (no login required)
if (pathname.startsWith('/patient-portal/video/')) {
  return nextWithPathname(req);
}
```

This must be placed **before** the `pathname.startsWith('/patient-portal')` check that requires authentication.

- [ ] **Step 3: Add Visio item to sidebar**

In `apps/web/src/components/layouts/sidebar.tsx`, add to `NAV_ITEMS` array after the `Calendrier` entry:

```typescript
import { Video } from 'lucide-react';

// Add after Calendrier:
{ label: 'Visio', href: '/dashboard/video', icon: Video },
```

- [ ] **Step 4: Verify build**

```bash
cd apps/web && npx next build
```

Expected: Build succeeds (pages not yet created, but that's OK — they'll be created in next tasks).

- [ ] **Step 5: Commit**

```bash
git add apps/web/next.config.mjs apps/web/src/middleware.ts apps/web/src/components/layouts/sidebar.tsx
git commit -m "feat(video): update CSP, middleware, and sidebar for video consultation"
```

---

## Task 7: Frontend — Video API Client + Hook

**Files:**
- Create: `apps/web/src/lib/api/video.ts`
- Create: `apps/web/src/hooks/use-video-call.ts`

**Dependencies:** `npm install @livekit/components-react livekit-client` in `apps/web/`

- [ ] **Step 1: Install LiveKit frontend packages**

```bash
cd apps/web && npm install @livekit/components-react livekit-client
```

- [ ] **Step 2: Create video API client**

Create `apps/web/src/lib/api/video.ts`:

```typescript
import { apiClient } from './client';

export const videoApi = {
  createRoom: (appointmentId: string, token: string) =>
    apiClient.post<{ id: string; roomName: string; status: string }>(
      '/video/rooms',
      { appointmentId },
      token,
    ),

  getPsyToken: (appointmentId: string, token: string) =>
    apiClient.post<{ token: string; wsUrl: string; roomName: string }>(
      `/video/rooms/${appointmentId}/token`,
      {},
      token,
    ),

  endRoom: (appointmentId: string, token: string) =>
    apiClient.post<void>(`/video/rooms/${appointmentId}/end`, {}, token),

  getTodayRooms: (token: string) =>
    apiClient.get<Array<{
      appointmentId: string;
      patientName: string;
      scheduledAt: string;
      duration: number;
      status: 'upcoming' | 'ready' | 'patient_waiting' | 'active' | 'ended';
      roomId: string | null;
    }>>('/video/today', token),

  joinAsPatient: (joinToken: string) =>
    apiClient.post<{
      token: string;
      wsUrl: string;
      roomName: string;
      needsConsent?: boolean;
    }>(`/video/join/${joinToken}`, {}),

  recordConsent: (joinToken: string) =>
    apiClient.post<{ ok: boolean }>(`/video/consent/${joinToken}`, {}),
};
```

- [ ] **Step 3: Create useVideoCall hook**

Create `apps/web/src/hooks/use-video-call.ts`:

```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVideoCallOptions {
  onParticipantJoined?: () => void;
  onParticipantLeft?: () => void;
  onDisconnected?: () => void;
}

export function useVideoCall(options: UseVideoCallOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectedAt, setConnectedAt] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start timer when connected
  useEffect(() => {
    if (isConnected && connectedAt) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - connectedAt.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected, connectedAt]);

  const handleConnected = useCallback(() => {
    setIsConnected(true);
    setIsReconnecting(false);
    setConnectedAt(new Date());
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    if (timerRef.current) clearInterval(timerRef.current);
    options.onDisconnected?.();
  }, [options]);

  const handleReconnecting = useCallback(() => {
    setIsReconnecting(true);
  }, []);

  const handleReconnected = useCallback(() => {
    setIsReconnecting(false);
  }, []);

  return {
    isConnected,
    isReconnecting,
    connectedAt,
    elapsedSeconds,
    handleConnected,
    handleDisconnected,
    handleReconnecting,
    handleReconnected,
  };
}

export function formatElapsedTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/api/video.ts apps/web/src/hooks/use-video-call.ts apps/web/package.json apps/web/package-lock.json
git commit -m "feat(video): add video API client and useVideoCall hook"
```

---

## Task 8: Frontend — Calendar Integration

**Files:**
- Modify: `apps/web/src/components/calendar/create-appointment-dialog.tsx`
- Modify: `apps/web/src/components/calendar/calendar-content.tsx`

- [ ] **Step 1: Add "Consultation en visio" checkbox to CreateAppointmentDialog**

In `apps/web/src/components/calendar/create-appointment-dialog.tsx`:

Add a state: `const [isOnline, setIsOnline] = useState(false);`

Add a checkbox between the duration pills and the submit button:

```tsx
<div className="flex items-center gap-2 pt-2">
  <input
    type="checkbox"
    id="isOnline"
    checked={isOnline}
    onChange={(e) => setIsOnline(e.target.checked)}
    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
  />
  <label htmlFor="isOnline" className="text-sm text-muted-foreground flex items-center gap-1.5">
    <Video className="h-4 w-4" />
    Consultation en visio
  </label>
</div>
```

Import `Video` from `lucide-react`.

Update the submit handler to include `isOnline` in the API call:

```typescript
await appointmentsApi.create({ patientId: selectedPatient, scheduledAt, duration, isOnline }, token);
```

Update the `appointmentsApi.create` type to accept `isOnline?: boolean`.

- [ ] **Step 2: Add video badge and "Démarrer" button in calendar-content.tsx**

In `apps/web/src/components/calendar/calendar-content.tsx`:

Add `isOnline` to the local `Appointment` interface.

In the appointment card rendering, add a video badge:

```tsx
{appointment.isOnline && (
  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
    <Video className="h-3 w-3" />
    Visio
  </span>
)}
```

Add a "Démarrer la visio" button visible when isOnline and within the 10-min window:

```tsx
{appointment.isOnline && isWithinVideoWindow(appointment.scheduledAt) && appointment.status !== 'completed' && (
  <button
    onClick={() => router.push(`/dashboard/video/${appointment.id}`)}
    className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition-colors"
  >
    <Video className="h-3.5 w-3.5" />
    Démarrer la visio
  </button>
)}
```

Add the helper function:

```typescript
function isWithinVideoWindow(scheduledAt: string): boolean {
  const scheduled = new Date(scheduledAt);
  const now = new Date();
  const windowStart = new Date(scheduled.getTime() - 10 * 60 * 1000);
  return now >= windowStart;
}
```

Import `Video` from `lucide-react` and `useRouter` from `next/navigation`.

- [ ] **Step 3: Verify build**

```bash
cd apps/web && npx next build
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/calendar/
git commit -m "feat(video): add visio checkbox and calendar video badge"
```

---

## Task 9: Frontend — Dashboard Video Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/video/page.tsx`

- [ ] **Step 1: Create the video dashboard page**

Create `apps/web/src/app/(dashboard)/video/page.tsx`:

```tsx
'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Video, Clock, User, ArrowRight, CheckCircle } from 'lucide-react';
import { videoApi } from '@/lib/api/video';

const STATUS_CONFIG = {
  upcoming: { label: 'À venir', color: 'text-muted-foreground', bg: 'bg-muted' },
  ready: { label: 'Prêt', color: 'text-accent', bg: 'bg-accent/10' },
  patient_waiting: { label: 'Patient attend', color: 'text-orange-600', bg: 'bg-orange-50' },
  active: { label: 'En cours', color: 'text-green-600', bg: 'bg-green-50' },
  ended: { label: 'Terminée', color: 'text-muted-foreground', bg: 'bg-muted' },
} as const;

export default function VideoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.accessToken || '';

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['video-today'],
    queryFn: () => videoApi.getTodayRooms(token),
    enabled: !!token,
    refetchInterval: 15000, // Refresh every 15s to catch patient arrivals
  });

  const handleStart = async (appointmentId: string) => {
    try {
      await videoApi.createRoom(appointmentId, token);
      router.push(`/dashboard/video/${appointmentId}`);
    } catch (err: any) {
      // Toast error
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consultations vidéo</h1>
          <p className="text-sm text-muted-foreground mt-1">Vos visios du jour</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune consultation vidéo aujourd'hui</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rooms.map((room) => {
              const config = STATUS_CONFIG[room.status];
              const time = new Date(room.scheduledAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit',
              });

              return (
                <div key={room.appointmentId} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-semibold text-foreground w-14">{time}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{room.patientName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{room.duration} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
                      {room.status === 'ended' && <CheckCircle className="h-3 w-3" />}
                      {config.label}
                    </span>
                    {(room.status === 'ready' || room.status === 'patient_waiting') && (
                      <button
                        onClick={() => handleStart(room.appointmentId)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
                      >
                        {room.status === 'patient_waiting' ? 'Rejoindre' : 'Démarrer'}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                    {room.status === 'active' && (
                      <button
                        onClick={() => router.push(`/dashboard/video/${room.appointmentId}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                      >
                        En cours
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd apps/web && npx next build
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/video/
git commit -m "feat(video): add video dashboard page listing today's consultations"
```

---

## Task 10: Frontend — Psy Consultation Room

**Files:**
- Create: `apps/web/src/components/video/video-controls.tsx`
- Create: `apps/web/src/components/video/session-timer.tsx`
- Create: `apps/web/src/components/video/video-room.tsx`
- Create: `apps/web/src/app/(dashboard)/video/[roomId]/page.tsx`

- [ ] **Step 1: Create SessionTimer component**

Create `apps/web/src/components/video/session-timer.tsx`:

```tsx
'use client';

import { formatElapsedTime } from '@/hooks/use-video-call';
import { Clock } from 'lucide-react';

interface SessionTimerProps {
  elapsedSeconds: number;
  plannedDurationMin: number;
}

export function SessionTimer({ elapsedSeconds, plannedDurationMin }: SessionTimerProps) {
  const isOvertime = elapsedSeconds > plannedDurationMin * 60;

  return (
    <div className={`flex items-center gap-1.5 text-sm font-mono ${isOvertime ? 'text-red-500' : 'text-foreground'}`}>
      <Clock className="h-4 w-4" />
      {formatElapsedTime(elapsedSeconds)}
      {isOvertime && <span className="text-xs font-sans">(dépassé)</span>}
    </div>
  );
}
```

- [ ] **Step 2: Create VideoControls component**

Create `apps/web/src/components/video/video-controls.tsx`:

```tsx
'use client';

import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Mic, MicOff, VideoIcon, VideoOff, PhoneOff, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { SessionTimer } from './session-timer';

interface VideoControlsProps {
  elapsedSeconds: number;
  plannedDurationMin: number;
  showNotes: boolean;
  onToggleNotes: () => void;
  onEndCall: () => void;
}

export function VideoControls({
  elapsedSeconds,
  plannedDurationMin,
  showNotes,
  onToggleNotes,
  onEndCall,
}: VideoControlsProps) {
  const { localParticipant } = useLocalParticipant();
  const isMicOn = localParticipant.isMicrophoneEnabled;
  const isCamOn = localParticipant.isCameraEnabled;

  return (
    <div className="flex items-center justify-between border-t border-border bg-white px-4 py-3">
      <SessionTimer elapsedSeconds={elapsedSeconds} plannedDurationMin={plannedDurationMin} />

      <div className="flex items-center gap-2">
        <button
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicOn)}
          className={`rounded-full p-3 transition-colors ${isMicOn ? 'bg-muted hover:bg-muted/80' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          title={isMicOn ? 'Couper le micro' : 'Activer le micro'}
        >
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          onClick={() => localParticipant.setCameraEnabled(!isCamOn)}
          className={`rounded-full p-3 transition-colors ${isCamOn ? 'bg-muted hover:bg-muted/80' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          title={isCamOn ? 'Couper la caméra' : 'Activer la caméra'}
        >
          {isCamOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        <button
          onClick={onToggleNotes}
          className="rounded-full p-3 bg-muted hover:bg-muted/80 transition-colors"
          title={showNotes ? 'Masquer les notes' : 'Afficher les notes'}
        >
          {showNotes ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
        </button>

        <button
          onClick={onEndCall}
          className="rounded-full p-3 bg-red-600 text-white hover:bg-red-700 transition-colors ml-2"
          title="Terminer la consultation"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>

      <div className="w-24" /> {/* Spacer for balance */}
    </div>
  );
}
```

- [ ] **Step 3: Create VideoRoom wrapper**

Create `apps/web/src/components/video/video-room.tsx`:

```tsx
'use client';

import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useParticipants,
  useRoomContext,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { useVideoCall } from '@/hooks/use-video-call';
import { VideoControls } from './video-controls';
import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface VideoRoomProps {
  token: string;
  wsUrl: string;
  plannedDurationMin: number;
  notesPanel: React.ReactNode;
  onCallEnd: () => void;
}

function VideoLayout({ plannedDurationMin, notesPanel, onCallEnd }: Omit<VideoRoomProps, 'token' | 'wsUrl'>) {
  const [showNotes, setShowNotes] = useState(true);
  const { elapsedSeconds, handleConnected, handleDisconnected, isReconnecting } = useVideoCall({
    onDisconnected: () => {},
  });

  const room = useRoomContext();
  useEffect(() => {
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, handleConnected, handleDisconnected]);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);

  const remoteTracks = tracks.filter(t => !t.participant.isLocal);
  const localTrack = tracks.find(t => t.participant.isLocal);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Video panel */}
      <div className={`flex flex-col ${showNotes ? 'w-[65%]' : 'w-full'} transition-all`}>
        <div className="flex-1 relative bg-gray-900">
          {isReconnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="text-white text-center">
                <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                <p>Reconnexion en cours...</p>
              </div>
            </div>
          )}

          {/* Remote participant (patient) */}
          {remoteTracks.length > 0 && remoteTracks[0].publication ? (
            <VideoTrack trackRef={remoteTracks[0]} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white/60">
                <User className="h-20 w-20 mx-auto mb-4 opacity-40" />
                <p className="text-lg">En attente du patient...</p>
              </div>
            </div>
          )}

          {/* Local participant (psy) PiP */}
          {localTrack?.publication && (
            <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
              <VideoTrack trackRef={localTrack} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <VideoControls
          elapsedSeconds={elapsedSeconds}
          plannedDurationMin={plannedDurationMin}
          showNotes={showNotes}
          onToggleNotes={() => setShowNotes(!showNotes)}
          onEndCall={onCallEnd}
        />
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div className="w-[35%] border-l border-border bg-white overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Notes de séance</h2>
          </div>
          <div className="p-4">
            {notesPanel}
          </div>
        </div>
      )}

      <RoomAudioRenderer />
    </div>
  );
}

export function PsyVideoRoom({ token, wsUrl, plannedDurationMin, notesPanel, onCallEnd }: VideoRoomProps) {
  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect={true}
      video={true}
      audio={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
    >
      <VideoLayout
        plannedDurationMin={plannedDurationMin}
        notesPanel={notesPanel}
        onCallEnd={onCallEnd}
      />
    </LiveKitRoom>
  );
}
```

- [ ] **Step 4: Create consultation room page**

Create `apps/web/src/app/(dashboard)/video/[roomId]/page.tsx`:

```tsx
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { videoApi } from '@/lib/api/video';
import { PsyVideoRoom } from '@/components/video/video-room';
import { useToast } from '@/components/ui/toast';

export default function ConsultationRoomPage() {
  const { roomId } = useParams<{ roomId: string }>(); // roomId = appointmentId
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [tokenData, setTokenData] = useState<{
    token: string;
    wsUrl: string;
    roomName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(50);

  useEffect(() => {
    if (!session?.accessToken) return;

    const init = async () => {
      try {
        // Ensure room exists
        await videoApi.createRoom(roomId, session.accessToken);
        // Get psy token
        const data = await videoApi.getPsyToken(roomId, session.accessToken);
        setTokenData(data);
      } catch (err: any) {
        toast({ title: 'Erreur', description: err.message || 'Impossible de démarrer la visio', variant: 'destructive' });
        router.push('/dashboard/video');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [session?.accessToken, roomId]);

  const handleEndCall = async () => {
    if (!session?.accessToken) return;
    try {
      await videoApi.endRoom(roomId, session.accessToken);
      queryClient.invalidateQueries({ queryKey: ['video-today'] });
      toast({ title: 'Consultation terminée', description: 'Une séance a été créée automatiquement.' });
      router.push('/dashboard/video');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  if (loading || !tokenData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Connexion à la salle de visio...</p>
        </div>
      </div>
    );
  }

  return (
    <PsyVideoRoom
      token={tokenData.token}
      wsUrl={tokenData.wsUrl}
      plannedDurationMin={duration}
      notesPanel={
        <textarea
          className="w-full h-64 border border-border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Prenez vos notes ici..."
        />
      }
      onCallEnd={handleEndCall}
    />
  );
}
```

> **Note:** Le panneau notes utilise un textarea simple pour le MVP. L'intégration avec le vrai `session-note-editor.tsx` se fera quand la Session est auto-créée à la fin de l'appel.

- [ ] **Step 5: Verify build**

```bash
cd apps/web && npx next build
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/video/ apps/web/src/app/\(dashboard\)/video/
git commit -m "feat(video): add psy consultation room with video, controls, and notes panel"
```

---

## Task 11: Frontend — Patient Waiting Room & Call

**Files:**
- Create: `apps/web/src/components/video/waiting-room.tsx`
- Create: `apps/web/src/components/video/video-consent-screen.tsx`
- Create: `apps/web/src/components/video/patient-video-room.tsx`
- Create: `apps/web/src/app/(patient-portal)/video/[token]/page.tsx`

- [ ] **Step 1: Create VideoConsentScreen**

Create `apps/web/src/components/video/video-consent-screen.tsx`:

```tsx
'use client';

import { Shield, Video } from 'lucide-react';

interface VideoConsentScreenProps {
  psychologistName: string;
  onAccept: () => void;
  isLoading?: boolean;
}

export function VideoConsentScreen({ psychologistName, onAccept, isLoading }: VideoConsentScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mx-auto mb-4">
          <Shield className="h-6 w-6 text-accent" />
        </div>
        <h1 className="text-xl font-bold text-center text-foreground mb-2">
          Consultation vidéo
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Avant de rejoindre votre consultation avec <strong>{psychologistName}</strong>,
          veuillez accepter les conditions suivantes :
        </p>
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-foreground mb-6">
          <p>En rejoignant cette consultation vidéo, vous autorisez le traitement
          de votre image et votre voix en temps réel sur une infrastructure
          certifiée HDS en France.</p>
          <p className="mt-2 font-medium">Aucun enregistrement n'est effectué.</p>
        </div>
        <button
          onClick={onAccept}
          disabled={isLoading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Video className="h-4 w-4" />
          {isLoading ? 'Enregistrement...' : 'Accepter et continuer'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create WaitingRoom**

Create `apps/web/src/components/video/waiting-room.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, VideoIcon, VideoOff, CheckCircle, XCircle } from 'lucide-react';

interface WaitingRoomProps {
  psychologistName: string;
  onReady: () => void;
}

export function WaitingRoom({ psychologistName, onReady }: WaitingRoomProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasMic, setHasMic] = useState(false);
  const [hasCam, setHasCam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        setHasMic(mediaStream.getAudioTracks().length > 0);
        setHasCam(mediaStream.getVideoTracks().length > 0);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        setError("Impossible d'accéder à votre caméra ou micro. Vérifiez les permissions de votre navigateur.");
      }
    };
    initMedia();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl font-bold text-foreground mb-1">PsyLib</h1>
        <p className="text-sm text-muted-foreground mb-6">Consultation vidéo</p>

        {/* Video preview */}
        <div className="relative w-64 h-48 mx-auto rounded-xl overflow-hidden bg-gray-900 mb-4">
          {error ? (
            <div className="flex items-center justify-center h-full text-red-400 text-sm p-4">{error}</div>
          ) : (
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          )}
        </div>

        {/* Media checks */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-1.5 text-sm">
            {hasMic ? (
              <><CheckCircle className="h-4 w-4 text-green-500" /><Mic className="h-4 w-4" /> Micro OK</>
            ) : (
              <><XCircle className="h-4 w-4 text-red-500" /><MicOff className="h-4 w-4" /> Micro</>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            {hasCam ? (
              <><CheckCircle className="h-4 w-4 text-green-500" /><VideoIcon className="h-4 w-4" /> Caméra OK</>
            ) : (
              <><XCircle className="h-4 w-4 text-red-500" /><VideoOff className="h-4 w-4" /> Caméra</>
            )}
          </div>
        </div>

        <p className="text-foreground font-medium mb-2">
          Votre psychologue va vous recevoir dans quelques instants...
        </p>
        <div className="flex items-center justify-center gap-2 text-accent">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm">En attente</span>
        </div>

        {(hasMic || hasCam) && (
          <button
            onClick={() => { stream?.getTracks().forEach(t => t.stop()); onReady(); }}
            className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Rejoindre la salle d'attente
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create PatientVideoRoom**

Create `apps/web/src/components/video/patient-video-room.tsx`:

```tsx
'use client';

import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useRoomContext,
  RoomAudioRenderer,
  useLocalParticipant,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { useEffect, useState } from 'react';
import { Mic, MicOff, VideoIcon, VideoOff, User } from 'lucide-react';

function PatientLayout() {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    const onDisconnected = () => setDisconnected(true);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => { room.off(RoomEvent.Disconnected, onDisconnected); };
  }, [room]);

  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const remoteTracks = tracks.filter(t => !t.participant.isLocal);
  const localTrack = tracks.find(t => t.participant.isLocal);

  const isMicOn = localParticipant.isMicrophoneEnabled;
  const isCamOn = localParticipant.isCameraEnabled;

  if (disconnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-xl font-bold text-foreground mb-2">La consultation est terminée</h1>
          <p className="text-muted-foreground mb-4">Merci. Prenez soin de vous.</p>
          <a href="/patient-portal" className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            Retour à mon espace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="flex-1 relative">
        {remoteTracks.length > 0 && remoteTracks[0].publication ? (
          <VideoTrack trackRef={remoteTracks[0]} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/60">
              <User className="h-20 w-20 mx-auto mb-4 opacity-40" />
              <p>En attente de votre psychologue...</p>
            </div>
          </div>
        )}

        {localTrack?.publication && (
          <div className="absolute bottom-4 right-4 w-40 h-32 rounded-lg overflow-hidden border-2 border-white/20">
            <VideoTrack trackRef={localTrack} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 bg-gray-900 px-4 py-4">
        <button
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicOn)}
          className={`rounded-full p-3 ${isMicOn ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}
        >
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          onClick={() => localParticipant.setCameraEnabled(!isCamOn)}
          className={`rounded-full p-3 ${isCamOn ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}
        >
          {isCamOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>
      </div>

      <RoomAudioRenderer />
    </div>
  );
}

interface PatientVideoRoomProps {
  token: string;
  wsUrl: string;
}

export function PatientVideoRoom({ token, wsUrl }: PatientVideoRoomProps) {
  return (
    <LiveKitRoom serverUrl={wsUrl} token={token} connect={true} video={true} audio={true}>
      <PatientLayout />
    </LiveKitRoom>
  );
}
```

- [ ] **Step 4: Create patient video page**

Create `apps/web/src/app/(patient-portal)/video/[token]/page.tsx`:

```tsx
'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { videoApi } from '@/lib/api/video';
import { VideoConsentScreen } from '@/components/video/video-consent-screen';
import { WaitingRoom } from '@/components/video/waiting-room';
import { PatientVideoRoom } from '@/components/video/patient-video-room';

type Phase = 'loading' | 'consent' | 'waiting' | 'call' | 'error';

export default function PatientVideoPage() {
  const { token: joinToken } = useParams<{ token: string }>();
  const [phase, setPhase] = useState<Phase>('loading');
  const [tokenData, setTokenData] = useState<{ token: string; wsUrl: string } | null>(null);
  const [psychologistName, setPsychologistName] = useState('');
  const [error, setError] = useState('');
  const [consentLoading, setConsentLoading] = useState(false);

  // Initial check
  const checkToken = useCallback(async () => {
    try {
      const result = await videoApi.joinAsPatient(joinToken);
      if (result.needsConsent) {
        setPsychologistName((result as any).psychologistName || '');
        setPhase('consent');
      } else if (result.token) {
        setTokenData({ token: result.token, wsUrl: result.wsUrl });
        setPhase('waiting');
      }
    } catch (err: any) {
      setError(err.message || 'Lien de visio invalide ou expiré');
      setPhase('error');
    }
  }, [joinToken]);

  // Run on mount
  useEffect(() => { checkToken(); }, [checkToken]);

  const handleConsent = async () => {
    setConsentLoading(true);
    try {
      await videoApi.recordConsent(joinToken);
      // Re-fetch token now that consent is recorded
      const result = await videoApi.joinAsPatient(joinToken);
      if (result.token) {
        setTokenData({ token: result.token, wsUrl: result.wsUrl });
        setPhase('waiting');
      }
    } catch (err: any) {
      setError(err.message);
      setPhase('error');
    } finally {
      setConsentLoading(false);
    }
  };

  const handleReady = () => {
    if (tokenData) setPhase('call');
  };

  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Lien invalide</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (phase === 'consent') {
    return <VideoConsentScreen psychologistName={psychologistName} onAccept={handleConsent} isLoading={consentLoading} />;
  }

  if (phase === 'waiting') {
    return <WaitingRoom psychologistName={psychologistName} onReady={handleReady} />;
  }

  if (phase === 'call' && tokenData) {
    return <PatientVideoRoom token={tokenData.token} wsUrl={tokenData.wsUrl} />;
  }

  return null;
}
```

- [ ] **Step 5: Verify build**

```bash
cd apps/web && npx next build
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/video/ apps/web/src/app/\(patient-portal\)/video/
git commit -m "feat(video): add patient waiting room, consent screen, and video call page"
```

---

## Task 12: Docker Compose — LiveKit Infrastructure

**Files:**
- Create: `docker/livekit/docker-compose.yml`
- Create: `docker/livekit/livekit.yaml`
- Create: `docker/livekit/Caddyfile`

- [ ] **Step 1: Create docker-compose.yml**

Create `docker/livekit/docker-compose.yml`:

```yaml
version: '3.8'

services:
  livekit:
    image: livekit/livekit-server:v1.8
    restart: unless-stopped
    network_mode: host
    environment:
      - LIVEKIT_CONFIG=/etc/livekit.yaml
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml:ro

  redis:
    image: redis:7.4-alpine
    restart: unless-stopped
    network_mode: host    # Same network as LiveKit for localhost:6379 access
    volumes:
      - redis-data:/data

  caddy:
    image: caddy:2.8-alpine
    restart: unless-stopped
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config

volumes:
  redis-data:
  caddy-data:
  caddy-config:
```

- [ ] **Step 2: Create livekit.yaml**

Create `docker/livekit/livekit.yaml`:

```yaml
port: 7880
rtc:
  udp_port: 7881
  port_range_start: 50000
  port_range_end: 50200
  use_external_ip: true
redis:
  address: localhost:6379
keys:
  # IMPORTANT: Replace with real keys before deploying
  # Generate with: docker run --rm livekit/generate
  APIxxxxxx: secretxxxxxx
turn:
  enabled: true
  domain: video.psylib.eu
  tls_port: 7882
room:
  empty_timeout: 300  # 5 minutes
logging:
  level: info
```

- [ ] **Step 3: Create Caddyfile**

Create `docker/livekit/Caddyfile`:

```
video.psylib.eu {
    reverse_proxy localhost:7880
}
```

- [ ] **Step 4: Commit**

```bash
git add docker/livekit/
git commit -m "infra(video): add LiveKit Docker Compose config for OVH HDS"
```

---

## Task 13: Final — Run All Tests & Verify

- [ ] **Step 1: Run all API tests**

```bash
cd apps/api && npx vitest run
```

Expected: All tests pass (existing + new video tests).

- [ ] **Step 2: Build frontend**

```bash
cd apps/web && npx next build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Run type check**

```bash
cd apps/api && npx tsc --noEmit && cd ../web && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix(video): address build and test issues"
```

---

## Summary

| Task | Description | Estimated Steps |
|---|---|---|
| 1 | Shared types + Prisma migration | 5 |
| 2 | VideoService (core logic + tests) | 7 |
| 3 | VideoController + Module + plan gating | 6 |
| 4 | Appointment DTO modification | 4 |
| 5 | Email notification + cron job | 4 |
| 6 | CSP, Middleware, Sidebar | 5 |
| 7 | Video API client + hook | 4 |
| 8 | Calendar integration (checkbox + badge) | 4 |
| 9 | Dashboard video page | 3 |
| 10 | Psy consultation room | 6 |
| 11 | Patient waiting room + call | 6 |
| 12 | Docker Compose infrastructure | 4 |
| 13 | Final tests & verification | 4 |
| **Total** | | **62 steps** |
