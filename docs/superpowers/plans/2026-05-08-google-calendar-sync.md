# Google Calendar Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bidirectional sync between PsyLib and Google Calendar — appointments push to Google, Google events block PsyLib availability.

**Architecture:** New `CalendarSyncModule` (NestJS) handles OAuth2, push/pull sync via BullMQ jobs, encrypted token storage. Frontend adds a settings section + external events in the calendar grid. `AppointmentsService` is extended with `EventEmitter2` emissions as a prerequisite.

**Tech Stack:** `googleapis` npm package, BullMQ (repeatable jobs + retries), AES-256-GCM encryption, EventEmitter2, Google Calendar API v3 push notifications.

**Spec:** `docs/superpowers/specs/2026-05-08-google-calendar-sync-design.md`

---

## Task 1: Prisma Schema + Migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260508_google_calendar_sync/migration.sql`

- [ ] **Step 1: Add enum and models to schema.prisma**

Add after the existing enums:

```prisma
enum CalendarProvider {
  google
}
```

Add new models:

```prisma
model CalendarConnection {
  id              String            @id @default(uuid())
  psychologistId  String            @unique @map("psychologist_id")
  provider        CalendarProvider  @default(google)
  accessToken     String            @map("access_token")
  refreshToken    String            @map("refresh_token")
  tokenExpiresAt  DateTime?         @map("token_expires_at")
  email           String?
  calendarId      String            @default("primary") @map("calendar_id")
  syncToken       String?           @map("sync_token")
  watchChannelId  String?           @map("watch_channel_id")
  watchResourceId String?           @map("watch_resource_id")
  watchToken      String?           @map("watch_token")
  watchExpiration DateTime?         @map("watch_expiration")
  lastSyncAt      DateTime?         @map("last_sync_at")
  isActive        Boolean           @default(true) @map("is_active")
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  psychologist           Psychologist              @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  externalCalendarEvents ExternalCalendarEvent[]

  @@map("calendar_connections")
}

model ExternalCalendarEvent {
  id                    String             @id @default(uuid())
  psychologistId        String             @map("psychologist_id")
  calendarConnectionId  String             @map("calendar_connection_id")
  externalId            String             @map("external_id")
  title                 String?
  startAt               DateTime           @map("start_at")
  endAt                 DateTime           @map("end_at")
  isAllDay              Boolean            @default(false) @map("is_all_day")
  status                String             @default("confirmed")
  lastUpdatedAt         DateTime?          @map("last_updated_at")
  createdAt             DateTime           @default(now()) @map("created_at")
  updatedAt             DateTime           @updatedAt @map("updated_at")

  psychologist       Psychologist        @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  calendarConnection CalendarConnection  @relation(fields: [calendarConnectionId], references: [id], onDelete: Cascade)

  @@unique([calendarConnectionId, externalId])
  @@index([psychologistId, startAt, endAt])
  @@map("external_calendar_events")
}
```

Add to the `Psychologist` model (in the relations section):

```prisma
calendarConnection     CalendarConnection?
externalCalendarEvents ExternalCalendarEvent[]
```

Add to the `Appointment` model:

```prisma
googleEventId  String?  @map("google_event_id")
```

- [ ] **Step 2: Create idempotent migration SQL**

Create `apps/api/prisma/migrations/20260508_google_calendar_sync/migration.sql`:

```sql
-- CreateEnum CalendarProvider
DO $$ BEGIN
  CREATE TYPE "CalendarProvider" AS ENUM ('google');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable calendar_connections
CREATE TABLE IF NOT EXISTS "calendar_connections" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "psychologist_id" UUID NOT NULL,
  "provider" "CalendarProvider" NOT NULL DEFAULT 'google',
  "access_token" TEXT NOT NULL,
  "refresh_token" TEXT NOT NULL,
  "token_expires_at" TIMESTAMP(3),
  "email" TEXT,
  "calendar_id" TEXT NOT NULL DEFAULT 'primary',
  "sync_token" TEXT,
  "watch_channel_id" TEXT,
  "watch_resource_id" TEXT,
  "watch_token" TEXT,
  "watch_expiration" TIMESTAMP(3),
  "last_sync_at" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "calendar_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable external_calendar_events
CREATE TABLE IF NOT EXISTS "external_calendar_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "psychologist_id" UUID NOT NULL,
  "calendar_connection_id" UUID NOT NULL,
  "external_id" TEXT NOT NULL,
  "title" TEXT,
  "start_at" TIMESTAMP(3) NOT NULL,
  "end_at" TIMESTAMP(3) NOT NULL,
  "is_all_day" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'confirmed',
  "last_updated_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "external_calendar_events_pkey" PRIMARY KEY ("id")
);

-- Add googleEventId to appointments
DO $$ BEGIN
  ALTER TABLE "appointments" ADD COLUMN "google_event_id" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_connections_psychologist_id_key"
  ON "calendar_connections"("psychologist_id");

CREATE UNIQUE INDEX IF NOT EXISTS "external_calendar_events_connection_external_key"
  ON "external_calendar_events"("calendar_connection_id", "external_id");

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_external_events_psy_dates"
  ON "external_calendar_events"("psychologist_id", "start_at", "end_at");

CREATE INDEX IF NOT EXISTS "idx_calendar_connections_psy"
  ON "calendar_connections"("psychologist_id");

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "calendar_connections"
    ADD CONSTRAINT "calendar_connections_psychologist_id_fkey"
    FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "external_calendar_events"
    ADD CONSTRAINT "external_calendar_events_psychologist_id_fkey"
    FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "external_calendar_events"
    ADD CONSTRAINT "external_calendar_events_calendar_connection_id_fkey"
    FOREIGN KEY ("calendar_connection_id") REFERENCES "calendar_connections"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

- [ ] **Step 3: Verify Prisma generates correctly**

Run: `cd apps/api && npx prisma generate`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/
git commit -m "feat(db): add migration for Google Calendar sync (calendar_connections + external_calendar_events)"
```

---

## Task 2: Shared Types

**Files:**
- Modify: `packages/shared-types/src/index.ts`

- [ ] **Step 1: Add CalendarProvider enum**

Add near the other enums:

```typescript
export enum CalendarProvider {
  GOOGLE = 'google',
}
```

- [ ] **Step 2: Add CalendarConnection interface**

```typescript
export interface CalendarConnection {
  id: string;
  psychologistId: string;
  provider: CalendarProvider;
  email: string | null;
  calendarId: string;
  lastSyncAt: string | null;
  isActive: boolean;
  createdAt: string;
}
```

- [ ] **Step 3: Add ExternalCalendarEvent interface**

```typescript
export interface ExternalCalendarEvent {
  id: string;
  psychologistId: string;
  externalId: string;
  title: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  status: string;
}
```

- [ ] **Step 4: Add audit actions**

Find the `AuditAction` enum and add:

```typescript
CALENDAR_CONNECT = 'CALENDAR_CONNECT',
CALENDAR_DISCONNECT = 'CALENDAR_DISCONNECT',
```

- [ ] **Step 5: Add calendarSync to PLAN_LIMITS**

First, update the **type annotation** of the `PLAN_LIMITS` Record — add `calendarSync: boolean` to the type:

```typescript
export const PLAN_LIMITS: Record<SubscriptionPlan, {
  patients: number | null;
  sessions: number | null;
  aiSummaries: number;
  // ... existing fields ...
  calendarSync: boolean;  // ADD THIS
}> = { ... }
```

Then add the value to each plan entry:

```typescript
[SubscriptionPlan.FREE]:    { ..., calendarSync: false },
[SubscriptionPlan.STARTER]: { ..., calendarSync: true },
[SubscriptionPlan.PRO]:     { ..., calendarSync: true },
[SubscriptionPlan.CLINIC]:  { ..., calendarSync: true },
```

- [ ] **Step 6: Add AppointmentEventPayload interface**

```typescript
export interface AppointmentEventPayload {
  psychologistId: string;
  appointmentId: string;
  patientId: string;
  scheduledAt: Date;
  duration: number;
  consultationTypeId?: string;
  isOnline: boolean;
  status: string;
}
```

- [ ] **Step 7: Build shared-types**

Run: `cd packages/shared-types && npm run build`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add packages/shared-types/
git commit -m "feat(shared-types): add Google Calendar sync types, plan limits, appointment events"
```

---

## Task 3: EventEmitter2 in AppointmentsService (prerequisite)

**Files:**
- Modify: `apps/api/src/appointments/appointments.service.ts`
- Modify: `apps/api/src/appointments/appointments.module.ts`

- [ ] **Step 1: Import EventEmitter2 in service**

Add import at top of `appointments.service.ts`:

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
```

Add to constructor (after `config: ConfigService`):

```typescript
private readonly eventEmitter: EventEmitter2,
```

- [ ] **Step 2: Emit appointment.created in create()**

After the successful `prisma.appointment.create()` call and before the return, add:

```typescript
this.eventEmitter.emit('appointment.created', {
  psychologistId: psy.id,
  appointmentId: appointment.id,
  patientId: appointment.patientId,
  scheduledAt: appointment.scheduledAt,
  duration: appointment.duration,
  consultationTypeId: appointment.consultationTypeId ?? undefined,
  isOnline: appointment.isOnline,
  status: appointment.status,
});
```

- [ ] **Step 3: Emit appointment.created in createGroup()**

Same pattern, after the group appointment is created:

```typescript
this.eventEmitter.emit('appointment.created', {
  psychologistId: psy.id,
  appointmentId: appointment.id,
  patientId: appointment.patientId,
  scheduledAt: appointment.scheduledAt,
  duration: appointment.duration,
  consultationTypeId: appointment.consultationTypeId ?? undefined,
  isOnline: appointment.isOnline,
  status: appointment.status,
});
```

- [ ] **Step 4: Emit appointment.updated in update()**

After the successful `prisma.appointment.update()` call:

```typescript
this.eventEmitter.emit('appointment.updated', {
  psychologistId: updated.psychologistId,
  appointmentId: updated.id,
  patientId: updated.patientId,
  scheduledAt: updated.scheduledAt,
  duration: updated.duration,
  consultationTypeId: updated.consultationTypeId ?? undefined,
  isOnline: updated.isOnline,
  status: updated.status,
});
```

- [ ] **Step 5: Emit appointment.cancelled in cancel() and cancelByToken()**

After the status is set to `cancelled` in both methods:

```typescript
this.eventEmitter.emit('appointment.cancelled', {
  psychologistId: appointment.psychologistId,
  appointmentId: appointment.id,
  patientId: appointment.patientId,
  scheduledAt: appointment.scheduledAt,
  duration: appointment.duration,
  consultationTypeId: appointment.consultationTypeId ?? undefined,
  isOnline: appointment.isOnline,
  status: 'cancelled',
});
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/appointments/
git commit -m "feat(appointments): add EventEmitter2 emissions for appointment lifecycle events"
```

---

## Task 4: Install googleapis + Google Calendar Provider

**Files:**
- Create: `apps/api/src/calendar-sync/google-calendar.provider.ts`
- Create: `apps/api/src/calendar-sync/calendar-sync.constants.ts`

- [ ] **Step 1: Install googleapis**

Run: `cd apps/api && npm install googleapis`

- [ ] **Step 2: Create constants file**

Create `apps/api/src/calendar-sync/calendar-sync.constants.ts`:

```typescript
export const CALENDAR_SYNC_QUEUE = 'calendar-sync';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

export const GOOGLE_COLOR_MAP: Record<string, string> = {
  '#3D52A0': '9',  // Blueberry (primary)
  '#0D9488': '2',  // Sage (accent)
  '#7C3AED': '3',  // Grape (warm)
};

export const DEFAULT_GOOGLE_COLOR = '9'; // Blueberry
```

- [ ] **Step 3: Create Google Calendar provider**

Create `apps/api/src/calendar-sync/google-calendar.provider.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_SCOPES } from './calendar-sync.constants';

@Injectable()
export class GoogleCalendarProvider {
  private readonly logger = new Logger(GoogleCalendarProvider.name);
  private oauth2Client: OAuth2Client;

  constructor(private readonly config: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
      this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      this.config.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl(state: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GOOGLE_SCOPES,
      state,
    });
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    email: string | null;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    // Get user email
    let email: string | null = null;
    try {
      this.oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      email = userInfo.data.email ?? null;
    } catch (err) {
      this.logger.warn('Could not fetch Google user email', err);
    }

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiresAt,
      email,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return {
      accessToken: credentials.access_token!,
      expiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000),
    };
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(token);
    } catch (err) {
      this.logger.warn('Token revocation failed (may already be revoked)', err);
    }
  }

  private getCalendarClient(accessToken: string): calendar_v3.Calendar {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.calendar({ version: 'v3', auth });
  }

  async createEvent(
    accessToken: string,
    calendarId: string,
    event: {
      summary: string;
      start: Date;
      end: Date;
      description?: string;
      colorId?: string;
    },
  ): Promise<string> {
    const cal = this.getCalendarClient(accessToken);
    const res = await cal.events.insert({
      calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.start.toISOString() },
        end: { dateTime: event.end.toISOString() },
        colorId: event.colorId,
        reminders: { useDefault: false, overrides: [] },
      },
    });
    return res.data.id!;
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: {
      summary?: string;
      start?: Date;
      end?: Date;
      description?: string;
      colorId?: string;
    },
  ): Promise<void> {
    const cal = this.getCalendarClient(accessToken);
    const body: calendar_v3.Schema$Event = {};
    if (event.summary) body.summary = event.summary;
    if (event.description) body.description = event.description;
    if (event.start) body.start = { dateTime: event.start.toISOString() };
    if (event.end) body.end = { dateTime: event.end.toISOString() };
    if (event.colorId) body.colorId = event.colorId;

    await cal.events.patch({
      calendarId,
      eventId,
      requestBody: body,
    });
  }

  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
  ): Promise<void> {
    const cal = this.getCalendarClient(accessToken);
    try {
      await cal.events.delete({ calendarId, eventId });
    } catch (err: unknown) {
      const status = (err as { code?: number }).code;
      if (status === 410 || status === 404) {
        this.logger.debug(`Event ${eventId} already deleted`);
        return;
      }
      throw err;
    }
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
    opts: { timeMin?: string; timeMax?: string; syncToken?: string },
  ): Promise<{
    events: calendar_v3.Schema$Event[];
    nextSyncToken: string | null;
  }> {
    const cal = this.getCalendarClient(accessToken);
    const allEvents: calendar_v3.Schema$Event[] = [];
    let pageToken: string | undefined;

    do {
      const params: calendar_v3.Params$Resource$Events$List = {
        calendarId,
        singleEvents: true,
        maxResults: 250,
        pageToken,
      };

      if (opts.syncToken) {
        params.syncToken = opts.syncToken;
      } else {
        params.timeMin = opts.timeMin;
        params.timeMax = opts.timeMax;
      }

      try {
        const res = await cal.events.list(params);
        allEvents.push(...(res.data.items ?? []));
        pageToken = res.data.nextPageToken ?? undefined;

        if (!res.data.nextPageToken) {
          return {
            events: allEvents,
            nextSyncToken: res.data.nextSyncToken ?? null,
          };
        }
      } catch (err: unknown) {
        const status = (err as { code?: number }).code;
        if (status === 410) {
          // syncToken invalid — caller should do full sync
          return { events: [], nextSyncToken: null };
        }
        throw err;
      }
    } while (pageToken);

    return { events: allEvents, nextSyncToken: null };
  }

  async createWatch(
    accessToken: string,
    calendarId: string,
    channelId: string,
    webhookUrl: string,
    token: string,
  ): Promise<{ resourceId: string; expiration: Date }> {
    const cal = this.getCalendarClient(accessToken);
    const res = await cal.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        token,
        params: { ttl: '604800' }, // 7 days
      },
    });
    return {
      resourceId: res.data.resourceId!,
      expiration: new Date(Number(res.data.expiration)),
    };
  }

  async stopWatch(
    accessToken: string,
    channelId: string,
    resourceId: string,
  ): Promise<void> {
    const cal = this.getCalendarClient(accessToken);
    try {
      await cal.channels.stop({
        requestBody: { id: channelId, resourceId },
      });
    } catch (err) {
      this.logger.warn('Failed to stop watch channel (may already be expired)', err);
    }
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/calendar-sync/ apps/api/package.json apps/api/package-lock.json
git commit -m "feat(calendar-sync): add Google Calendar API provider + constants"
```

---

## Task 5: CalendarSyncService (core orchestration)

**Prerequisite:** Task 2 must be completed and shared-types must be built (`npm run build` in `packages/shared-types/`) before the TypeScript check in this task.

**Files:**
- Create: `apps/api/src/calendar-sync/calendar-sync.service.ts`
- Create: `apps/api/src/calendar-sync/dto/calendar-sync.dto.ts`

- [ ] **Step 1: Create DTOs**

Create `apps/api/src/calendar-sync/dto/calendar-sync.dto.ts`:

```typescript
import { IsOptional, IsString } from 'class-validator';

export class CancelSyncDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
```

- [ ] **Step 2: Create CalendarSyncService**

Create `apps/api/src/calendar-sync/calendar-sync.service.ts`:

```typescript
import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GoogleCalendarProvider } from './google-calendar.provider';
import { CALENDAR_SYNC_QUEUE, DEFAULT_GOOGLE_COLOR, GOOGLE_COLOR_MAP } from './calendar-sync.constants';
import type { AppointmentEventPayload } from '@psyscale/shared-types';

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    private readonly googleProvider: GoogleCalendarProvider,
    @InjectQueue(CALENDAR_SYNC_QUEUE) private readonly syncQueue: Queue,
  ) {}

  // ──────────────── OAuth Flow ────────────────

  getAuthUrl(psychologistId: string): string {
    const secret = this.config.get<string>('ENCRYPTION_KEY')!;
    const state = jwt.sign({ psychologistId }, secret, { expiresIn: '10m' });
    return this.googleProvider.getAuthUrl(state);
  }

  verifyState(state: string): { psychologistId: string } {
    const secret = this.config.get<string>('ENCRYPTION_KEY')!;
    const payload = jwt.verify(state, secret) as { psychologistId: string };
    return payload;
  }

  async handleCallback(psychologistId: string, code: string): Promise<void> {
    const tokens = await this.googleProvider.exchangeCode(code);

    const psy = await this.prisma.psychologist.findUniqueOrThrow({
      where: { id: psychologistId },
    });

    // Upsert connection
    await this.prisma.calendarConnection.upsert({
      where: { psychologistId },
      create: {
        psychologistId,
        accessToken: this.encryption.encrypt(tokens.accessToken),
        refreshToken: this.encryption.encrypt(tokens.refreshToken),
        tokenExpiresAt: tokens.expiresAt,
        email: tokens.email,
      },
      update: {
        accessToken: this.encryption.encrypt(tokens.accessToken),
        refreshToken: this.encryption.encrypt(tokens.refreshToken),
        tokenExpiresAt: tokens.expiresAt,
        email: tokens.email,
        isActive: true,
        syncToken: null, // Reset sync token on reconnect
      },
    });

    // Audit
    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'CALENDAR_CONNECT',
      entityType: 'calendar_connection',
      entityId: psychologistId,
    });

    // Queue initial sync + watch setup
    await this.syncQueue.add('initial-sync', { psychologistId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
  }

  async disconnect(psychologistId: string, userId: string): Promise<void> {
    const conn = await this.prisma.calendarConnection.findUnique({
      where: { psychologistId },
    });
    if (!conn) return;

    // Stop watch channel
    if (conn.watchChannelId && conn.watchResourceId) {
      try {
        const accessToken = await this.getValidAccessToken(conn);
        await this.googleProvider.stopWatch(accessToken, conn.watchChannelId, conn.watchResourceId);
      } catch (err) {
        this.logger.warn('Failed to stop watch on disconnect', err);
      }
    }

    // Revoke Google token
    try {
      const refreshToken = this.encryption.decrypt(conn.refreshToken);
      await this.googleProvider.revokeToken(refreshToken);
    } catch (err) {
      this.logger.warn('Failed to revoke token on disconnect', err);
    }

    // Clear googleEventId from appointments
    await this.prisma.appointment.updateMany({
      where: { psychologistId, googleEventId: { not: null } },
      data: { googleEventId: null },
    });

    // Delete connection (cascade deletes external events)
    await this.prisma.calendarConnection.delete({
      where: { psychologistId },
    });

    // Audit
    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'CALENDAR_DISCONNECT',
      entityType: 'calendar_connection',
      entityId: psychologistId,
    });
  }

  async getStatus(psychologistId: string): Promise<{
    connected: boolean;
    email: string | null;
    lastSyncAt: string | null;
    isActive: boolean;
  }> {
    const conn = await this.prisma.calendarConnection.findUnique({
      where: { psychologistId },
    });
    if (!conn) {
      return { connected: false, email: null, lastSyncAt: null, isActive: false };
    }
    return {
      connected: true,
      email: conn.email,
      lastSyncAt: conn.lastSyncAt?.toISOString() ?? null,
      isActive: conn.isActive,
    };
  }

  // ──────────────── Token Management ────────────────

  async getValidAccessToken(conn: {
    id?: string;
    psychologistId: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt: Date | null;
  }): Promise<string> {
    const now = new Date();
    const buffer = 5 * 60 * 1000; // 5 min
    const expiresAt = conn.tokenExpiresAt ?? new Date(0);

    if (expiresAt.getTime() - now.getTime() > buffer) {
      return this.encryption.decrypt(conn.accessToken);
    }

    // Refresh needed
    try {
      const refreshToken = this.encryption.decrypt(conn.refreshToken);
      const newTokens = await this.googleProvider.refreshAccessToken(refreshToken);

      await this.prisma.calendarConnection.update({
        where: { psychologistId: conn.psychologistId },
        data: {
          accessToken: this.encryption.encrypt(newTokens.accessToken),
          tokenExpiresAt: newTokens.expiresAt,
        },
      });

      return newTokens.accessToken;
    } catch (err) {
      this.logger.error(`Token refresh failed for psy ${conn.psychologistId}`, err);

      // Mark connection inactive
      await this.prisma.calendarConnection.update({
        where: { psychologistId: conn.psychologistId },
        data: { isActive: false },
      });

      // Notify psy
      const psy = await this.prisma.psychologist.findUnique({
        where: { id: conn.psychologistId },
        select: { userId: true },
      });
      if (psy) {
        await this.notifications.createAndDispatch(
          psy.userId,
          'appointment_update',
          'Synchronisation Google Calendar interrompue',
          'Votre connexion Google Calendar a expiré. Reconnectez-la dans les paramètres de votre cabinet.',
        );
      }

      throw new ForbiddenException('Google Calendar token expired');
    }
  }

  // ──────────────── Outbound Sync (PsyLib → Google) ────────────────

  @OnEvent('appointment.created')
  async handleAppointmentCreated(event: AppointmentEventPayload): Promise<void> {
    try {
      await this.pushToGoogle('create', event);
    } catch (err) {
      this.logger.error('Failed to push appointment.created to Google', err);
    }
  }

  @OnEvent('appointment.updated')
  async handleAppointmentUpdated(event: AppointmentEventPayload): Promise<void> {
    try {
      await this.pushToGoogle('update', event);
    } catch (err) {
      this.logger.error('Failed to push appointment.updated to Google', err);
    }
  }

  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(event: AppointmentEventPayload): Promise<void> {
    try {
      await this.pushToGoogle('delete', event);
    } catch (err) {
      this.logger.error('Failed to push appointment.cancelled to Google', err);
    }
  }

  private async pushToGoogle(
    action: 'create' | 'update' | 'delete',
    event: AppointmentEventPayload,
  ): Promise<void> {
    const conn = await this.prisma.calendarConnection.findUnique({
      where: { psychologistId: event.psychologistId },
    });
    if (!conn || !conn.isActive) return;

    const accessToken = await this.getValidAccessToken(conn);

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: event.appointmentId },
      include: {
        patient: { select: { name: true } },
        consultationType: { select: { color: true } },
      },
    });
    if (!appointment) return;

    const firstName = appointment.patient.name.split(' ')[0] ?? 'Patient';
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const colorId = GOOGLE_COLOR_MAP[appointment.consultationType?.color ?? ''] ?? DEFAULT_GOOGLE_COLOR;

    if (action === 'create') {
      const startDate = new Date(event.scheduledAt);
      const endDate = new Date(startDate.getTime() + event.duration * 60000);

      const googleEventId = await this.googleProvider.createEvent(
        accessToken,
        conn.calendarId,
        {
          summary: `Consultation - ${firstName}`,
          start: startDate,
          end: endDate,
          description: `${frontendUrl}/dashboard/calendar`,
          colorId,
        },
      );

      await this.prisma.appointment.update({
        where: { id: event.appointmentId },
        data: { googleEventId },
      });
    } else if (action === 'update' && appointment.googleEventId) {
      const startDate = new Date(event.scheduledAt);
      const endDate = new Date(startDate.getTime() + event.duration * 60000);

      await this.googleProvider.updateEvent(
        accessToken,
        conn.calendarId,
        appointment.googleEventId,
        {
          summary: `Consultation - ${firstName}`,
          start: startDate,
          end: endDate,
          colorId,
        },
      );
    } else if (action === 'delete' && appointment.googleEventId) {
      await this.googleProvider.deleteEvent(
        accessToken,
        conn.calendarId,
        appointment.googleEventId,
      );
      await this.prisma.appointment.update({
        where: { id: event.appointmentId },
        data: { googleEventId: null },
      });
    }
  }

  // ──────────────── Inbound Sync (Google → PsyLib) ────────────────

  async performIncrementalSync(psychologistId: string): Promise<void> {
    const conn = await this.prisma.calendarConnection.findUnique({
      where: { psychologistId },
    });
    if (!conn || !conn.isActive) return;

    const accessToken = await this.getValidAccessToken(conn);

    const opts: { timeMin?: string; timeMax?: string; syncToken?: string } = {};
    if (conn.syncToken) {
      opts.syncToken = conn.syncToken;
    } else {
      // Full sync: next 90 days
      opts.timeMin = new Date().toISOString();
      opts.timeMax = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();
    }

    const { events, nextSyncToken } = await this.googleProvider.listEvents(
      accessToken,
      conn.calendarId,
      opts,
    );

    if (conn.syncToken && nextSyncToken === null) {
      // syncToken was invalid (HTTP 410) — retry as full sync
      this.logger.warn(`syncToken invalid for psy ${psychologistId}, doing full sync`);
      const fullResult = await this.googleProvider.listEvents(accessToken, conn.calendarId, {
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
      });
      await this.processGoogleEvents(psychologistId, conn.id, fullResult.events);
      if (fullResult.nextSyncToken) {
        await this.prisma.calendarConnection.update({
          where: { psychologistId },
          data: { syncToken: fullResult.nextSyncToken, lastSyncAt: new Date() },
        });
      }
      return;
    }

    await this.processGoogleEvents(psychologistId, conn.id, events);

    if (nextSyncToken) {
      await this.prisma.calendarConnection.update({
        where: { psychologistId },
        data: { syncToken: nextSyncToken, lastSyncAt: new Date() },
      });
    }
  }

  private async processGoogleEvents(
    psychologistId: string,
    connectionId: string,
    events: Array<{ id?: string | null; summary?: string | null; start?: { dateTime?: string | null; date?: string | null } | null; end?: { dateTime?: string | null; date?: string | null } | null; status?: string | null }>,
  ): Promise<void> {
    // Get all appointment googleEventIds for this psy to skip PsyLib-created events
    const psyAppointments = await this.prisma.appointment.findMany({
      where: { psychologistId, googleEventId: { not: null } },
      select: { googleEventId: true },
    });
    const psyEventIds = new Set(psyAppointments.map(a => a.googleEventId));

    for (const event of events) {
      if (!event.id) continue;

      // Skip events created by PsyLib
      if (psyEventIds.has(event.id)) continue;

      if (event.status === 'cancelled') {
        await this.prisma.externalCalendarEvent.deleteMany({
          where: { calendarConnectionId: connectionId, externalId: event.id },
        });
        continue;
      }

      const isAllDay = !!event.start?.date && !event.start?.dateTime;
      const startAt = isAllDay
        ? new Date(event.start!.date!)
        : new Date(event.start?.dateTime ?? event.start?.date ?? '');
      const endAt = isAllDay
        ? new Date(event.end!.date!)
        : new Date(event.end?.dateTime ?? event.end?.date ?? '');

      if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) continue;

      await this.prisma.externalCalendarEvent.upsert({
        where: {
          calendarConnectionId_externalId: {
            calendarConnectionId: connectionId,
            externalId: event.id,
          },
        },
        create: {
          psychologistId,
          calendarConnectionId: connectionId,
          externalId: event.id,
          title: event.summary ?? null,
          startAt,
          endAt,
          isAllDay,
          status: event.status ?? 'confirmed',
          lastUpdatedAt: new Date(),
        },
        update: {
          title: event.summary ?? null,
          startAt,
          endAt,
          isAllDay,
          status: event.status ?? 'confirmed',
          lastUpdatedAt: new Date(),
        },
      });
    }
  }

  // ──────────────── Watch Management ────────────────

  async setupWatch(psychologistId: string): Promise<void> {
    const conn = await this.prisma.calendarConnection.findUnique({
      where: { psychologistId },
    });
    if (!conn || !conn.isActive) return;

    const accessToken = await this.getValidAccessToken(conn);
    const channelId = randomUUID();
    const watchToken = randomUUID();
    const webhookUrl = `${this.config.get<string>('API_URL') ?? 'https://api.psylib.eu'}/api/v1/calendar-sync/google/webhook`;

    const { resourceId, expiration } = await this.googleProvider.createWatch(
      accessToken,
      conn.calendarId,
      channelId,
      webhookUrl,
      watchToken,
    );

    await this.prisma.calendarConnection.update({
      where: { psychologistId },
      data: { watchChannelId: channelId, watchResourceId: resourceId, watchToken, watchExpiration: expiration },
    });
  }

  async handleWebhook(channelId: string, resourceId: string, channelToken: string): Promise<void> {
    const conn = await this.prisma.calendarConnection.findFirst({
      where: { watchChannelId: channelId },
    });
    if (!conn || !conn.isActive) return;

    // Validate token
    if (conn.watchToken !== channelToken) {
      this.logger.warn(`Invalid webhook token for channel ${channelId}`);
      return;
    }

    // Deduplicate via BullMQ jobId (5s bucket)
    const bucket = Math.floor(Date.now() / 5000);
    await this.syncQueue.add(
      'incremental-sync',
      { psychologistId: conn.psychologistId },
      {
        jobId: `sync-${conn.psychologistId}-${bucket}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }

  async getActiveConnectionIds(): Promise<string[]> {
    const connections = await this.prisma.calendarConnection.findMany({
      where: { isActive: true },
      select: { psychologistId: true },
    });
    return connections.map(c => c.psychologistId);
  }

  async renewExpiringWatches(): Promise<void> {
    const threshold = new Date(Date.now() + 24 * 3600 * 1000); // 24h from now
    const expiring = await this.prisma.calendarConnection.findMany({
      where: {
        isActive: true,
        watchExpiration: { lt: threshold },
      },
    });

    for (const conn of expiring) {
      try {
        // Stop old watch
        if (conn.watchChannelId && conn.watchResourceId) {
          const accessToken = await this.getValidAccessToken(conn);
          await this.googleProvider.stopWatch(accessToken, conn.watchChannelId, conn.watchResourceId);
        }
        // Create new watch
        await this.setupWatch(conn.psychologistId);
        this.logger.log(`Renewed watch for psy ${conn.psychologistId}`);
      } catch (err) {
        this.logger.error(`Failed to renew watch for psy ${conn.psychologistId}`, err);
      }
    }
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/calendar-sync/
git commit -m "feat(calendar-sync): add CalendarSyncService with OAuth, outbound/inbound sync, watch management"
```

---

## Task 6: BullMQ Processor + Module

**Files:**
- Create: `apps/api/src/calendar-sync/calendar-sync.processor.ts`
- Create: `apps/api/src/calendar-sync/calendar-sync.module.ts`

- [ ] **Step 1: Create BullMQ processor**

Create `apps/api/src/calendar-sync/calendar-sync.processor.ts`:

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CalendarSyncService } from './calendar-sync.service';
import { CALENDAR_SYNC_QUEUE } from './calendar-sync.constants';

interface SyncJobData {
  psychologistId: string;
}

@Processor(CALENDAR_SYNC_QUEUE, { concurrency: 2 })
export class CalendarSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CalendarSyncProcessor.name);

  constructor(private readonly syncService: CalendarSyncService) {
    super();
  }

  async process(job: Job<SyncJobData>): Promise<void> {
    const { psychologistId } = job.data;

    switch (job.name) {
      case 'initial-sync': {
        this.logger.log(`Initial sync for psy ${psychologistId}`);
        await this.syncService.performIncrementalSync(psychologistId);
        await this.syncService.setupWatch(psychologistId);
        break;
      }
      case 'incremental-sync': {
        this.logger.debug(`Incremental sync for psy ${psychologistId}`);
        await this.syncService.performIncrementalSync(psychologistId);
        break;
      }
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
```

- [ ] **Step 2: Create module**

Create `apps/api/src/calendar-sync/calendar-sync.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CalendarSyncController } from './calendar-sync.controller';
import { CalendarSyncService } from './calendar-sync.service';
import { GoogleCalendarProvider } from './google-calendar.provider';
import { CalendarSyncProcessor } from './calendar-sync.processor';
import { CALENDAR_SYNC_QUEUE } from './calendar-sync.constants';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CALENDAR_SYNC_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    }),
    CommonModule,
    NotificationsModule,
    BillingModule,
  ],
  controllers: [CalendarSyncController],
  providers: [
    CalendarSyncService,
    GoogleCalendarProvider,
    CalendarSyncProcessor,
  ],
  exports: [CalendarSyncService],
})
export class CalendarSyncModule {}
```

- [ ] **Step 3: Register module in app.module.ts**

Add `CalendarSyncModule` to the `imports` array of `apps/api/src/app.module.ts`:

```typescript
import { CalendarSyncModule } from './calendar-sync/calendar-sync.module';
// In imports:
CalendarSyncModule,
```

Also add optional Google env vars to the Zod validation schema in `app.module.ts` (if one exists):

```typescript
GOOGLE_CLIENT_ID: z.string().optional(),
GOOGLE_CLIENT_SECRET: z.string().optional(),
GOOGLE_REDIRECT_URI: z.string().optional(),
```

- [ ] **Step 4: Add polling cron job**

Add a repeatable job registration. In `CalendarSyncService`, add an `onModuleInit`:

```typescript
async onModuleInit(): Promise<void> {
  // Register repeatable polling job (every 15 min)
  await this.syncQueue.add(
    'poll-all',
    {},
    {
      repeat: { every: 15 * 60 * 1000 },
      removeOnComplete: { count: 10 },
    },
  );
  this.logger.log('Calendar sync polling job registered (every 15 min)');
}
```

And handle `poll-all` in the processor:

```typescript
case 'poll-all': {
  this.logger.debug('Polling all active calendar connections');
  const psyIds = await this.syncService.getActiveConnectionIds();
  for (const psychologistId of psyIds) {
    try {
      await this.syncService.performIncrementalSync(psychologistId);
    } catch (err) {
      this.logger.error(`Poll sync failed for psy ${psychologistId}`, err);
    }
  }
  await this.syncService.renewExpiringWatches();
  break;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/calendar-sync/ apps/api/src/app.module.ts
git commit -m "feat(calendar-sync): add BullMQ processor, module registration, 15-min poll cron"
```

---

## Task 7: CalendarSyncController (OAuth + webhook)

**Files:**
- Create: `apps/api/src/calendar-sync/calendar-sync.controller.ts`

- [ ] **Step 1: Create controller**

Create `apps/api/src/calendar-sync/calendar-sync.controller.ts`:

```typescript
import { Controller, Get, Post, Delete, Query, Res, Headers, UseGuards, HttpCode, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CalendarSyncService } from './calendar-sync.service';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePlan } from '../billing/decorators/require-plan.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionPlan } from '@psyscale/shared-types';
import { PrismaService } from '../common/prisma.service';

interface KeycloakUser {
  sub: string;
}

@Controller('calendar-sync')
export class CalendarSyncController {
  private readonly logger = new Logger(CalendarSyncController.name);

  constructor(
    private readonly calendarSyncService: CalendarSyncService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('google/auth')
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.STARTER, SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async startAuth(@CurrentUser() user: KeycloakUser): Promise<{ url: string }> {
    const psy = await this.prisma.psychologist.findUniqueOrThrow({
      where: { userId: user.sub },
    });
    const url = this.calendarSyncService.getAuthUrl(psy.id);
    return { url };
  }

  @Get('google/callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';

    try {
      const { psychologistId } = this.calendarSyncService.verifyState(state);
      await this.calendarSyncService.handleCallback(psychologistId, code);
      res.redirect(`${frontendUrl}/dashboard/settings/practice?calendar=connected`);
    } catch (err) {
      this.logger.error('Google Calendar OAuth callback failed', err);
      res.redirect(`${frontendUrl}/dashboard/settings/practice?calendar=error`);
    }
  }

  @Get('status')
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async getStatus(@CurrentUser() user: KeycloakUser) {
    const psy = await this.prisma.psychologist.findUniqueOrThrow({
      where: { userId: user.sub },
    });
    return this.calendarSyncService.getStatus(psy.id);
  }

  @Delete('disconnect')
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async disconnect(@CurrentUser() user: KeycloakUser) {
    const psy = await this.prisma.psychologist.findUniqueOrThrow({
      where: { userId: user.sub },
    });
    await this.calendarSyncService.disconnect(psy.id, user.sub);
    return { success: true };
  }

  @Post('google/webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-goog-channel-id') channelId: string,
    @Headers('x-goog-resource-id') resourceId: string,
    @Headers('x-goog-channel-token') channelToken: string,
    @Headers('x-goog-resource-state') resourceState: string,
  ): Promise<void> {
    if (resourceState === 'sync') {
      // Initial sync notification — ignore
      return;
    }

    if (!channelId || !resourceId || !channelToken) {
      this.logger.warn('Webhook received with missing headers');
      return;
    }

    await this.calendarSyncService.handleWebhook(channelId, resourceId, channelToken);
  }

  @Post('force-sync')
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async forceSync(@CurrentUser() user: KeycloakUser) {
    const psy = await this.prisma.psychologist.findUniqueOrThrow({
      where: { userId: user.sub },
    });
    await this.calendarSyncService.performIncrementalSync(psy.id);
    return { success: true };
  }

  @Get('external-events')
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async getExternalEvents(
    @CurrentUser() user: KeycloakUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const psy = await this.prisma.psychologist.findUniqueOrThrow({ where: { userId: user.sub } });
    return this.prisma.externalCalendarEvent.findMany({
      where: {
        psychologistId: psy.id,
        status: { not: 'cancelled' },
        startAt: { lt: new Date(to) },
        endAt: { gt: new Date(from) },
      },
      select: { id: true, title: true, startAt: true, endAt: true, isAllDay: true },
      orderBy: { startAt: 'asc' },
    });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/calendar-sync/
git commit -m "feat(calendar-sync): add controller with OAuth, webhook, status, disconnect endpoints"
```

---

## Task 8: Availability Service — External Events Blocking

**Files:**
- Modify: `apps/api/src/availability/availability.service.ts`

- [ ] **Step 1: Add external events query in getAvailableTimeslots()**

In `getAvailableTimeslots()`, after fetching appointments and before the slot generation loop, add:

```typescript
// Fetch external calendar events that overlap with the requested range
const externalEvents = await this.prisma.externalCalendarEvent.findMany({
  where: {
    psychologistId,
    status: { not: 'cancelled' },
    OR: [
      { startAt: { lt: to }, endAt: { gt: from } },
      { isAllDay: true, startAt: { gte: from, lt: to } },
    ],
  },
  select: { startAt: true, endAt: true, isAllDay: true },
});
```

- [ ] **Step 2: Block slots for external events**

In the per-day slot generation loop, before iterating time slots:

```typescript
// Check if this day is blocked by an all-day external event
const dayStart = new Date(year, month, day);
const dayEnd = new Date(year, month, day + 1);
const isBlockedByAllDay = externalEvents.some(
  e => e.isAllDay && e.startAt < dayEnd && e.endAt > dayStart,
);
if (isBlockedByAllDay) continue; // Skip entire day
```

And when checking slot conflicts, add external events to the occupied windows:

```typescript
// Also block slots that overlap with external calendar events
const externalConflict = externalEvents.some(e => {
  if (e.isAllDay) return false; // Already handled above
  const eStart = e.startAt.getTime() - breakBuffer;
  const eEnd = e.endAt.getTime() + breakBuffer;
  return slotStart < eEnd && slotEnd > eStart;
});
if (externalConflict) continue;
```

Where `breakBuffer = minBreakMinutes * 60 * 1000`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/availability/
git commit -m "feat(availability): block slots for external Google Calendar events"
```

---

## Task 9: Frontend API Client + Settings Component

**Files:**
- Create: `apps/web/src/lib/api/calendar-sync.ts`
- Create: `apps/web/src/components/settings/calendar-sync-settings.tsx`
- Modify: `apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx`

- [ ] **Step 1: Create API client**

Create `apps/web/src/lib/api/calendar-sync.ts`:

```typescript
import { apiClient } from './client';

export interface CalendarSyncStatus {
  connected: boolean;
  email: string | null;
  lastSyncAt: string | null;
  isActive: boolean;
}

export const calendarSyncApi = {
  getAuthUrl: (token: string) =>
    apiClient.get<{ url: string }>('/calendar-sync/google/auth', token),

  getStatus: (token: string) =>
    apiClient.get<CalendarSyncStatus>('/calendar-sync/status', token),

  disconnect: (token: string) =>
    apiClient.delete<{ success: boolean }>('/calendar-sync/disconnect', token),

  forceSync: (token: string) =>
    apiClient.post<{ success: boolean }>('/calendar-sync/force-sync', {}, token),
};
```

- [ ] **Step 2: Create settings component**

Create `apps/web/src/components/settings/calendar-sync-settings.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, RefreshCw, Unlink, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { calendarSyncApi, type CalendarSyncStatus } from '@/lib/api/calendar-sync';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'next/navigation';

interface CalendarSyncSettingsProps {
  token?: string;
}

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export function CalendarSyncSettings({ token: tokenProp }: CalendarSyncSettingsProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { success, error: toastError } = useToast();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus | null>(null);

  const token = tokenProp || session?.accessToken || '';

  // Handle callback params
  useEffect(() => {
    const calendarParam = searchParams.get('calendar');
    if (calendarParam === 'connected') {
      success('Google Calendar connecte avec succes !');
    } else if (calendarParam === 'error') {
      toastError('Erreur lors de la connexion a Google Calendar.');
    }
  }, [searchParams]);

  // Load status
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!token) { setLoading(false); return; }
    calendarSyncApi
      .getStatus(token)
      .then(setSyncStatus)
      .catch(() => setSyncStatus(null))
      .finally(() => setLoading(false));
  }, [token, sessionStatus, searchParams]);

  const handleConnect = async () => {
    try {
      const data = await calendarSyncApi.getAuthUrl(token);
      window.location.href = data.url;
    } catch {
      toastError('Erreur lors de la connexion a Google Calendar.');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deconnecter Google Calendar ? Les evenements Google ne bloqueront plus vos creneaux.')) return;
    setDisconnecting(true);
    try {
      await calendarSyncApi.disconnect(token);
      setSyncStatus(null);
      success('Google Calendar deconnecte.');
    } catch {
      toastError('Erreur lors de la deconnexion.');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      await calendarSyncApi.forceSync(token);
      const newStatus = await calendarSyncApi.getStatus(token);
      setSyncStatus(newStatus);
      success('Synchronisation terminee.');
    } catch {
      toastError('Erreur lors de la synchronisation.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
      </div>
    );
  }

  const isConnected = syncStatus?.connected ?? false;
  const isActive = syncStatus?.isActive ?? false;

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-base font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Google Calendar
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Synchronisez vos rendez-vous avec Google Calendar. Les evenements Google bloqueront automatiquement vos creneaux.
          </p>
        </div>
      </div>

      {!isConnected ? (
        <button
          type="button"
          onClick={handleConnect}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-white hover:bg-gray-50 text-sm font-medium text-foreground transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Connecter Google Calendar
        </button>
      ) : (
        <div className="space-y-3">
          {/* Connection status */}
          <div className="flex items-center gap-3">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Connecte
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                Connexion expiree
              </span>
            )}
            {syncStatus?.email && (
              <span className="text-sm text-muted-foreground">{syncStatus.email}</span>
            )}
          </div>

          {/* Last sync */}
          {syncStatus?.lastSyncAt && (
            <p className="text-xs text-muted-foreground">
              Derniere synchronisation : {new Date(syncStatus.lastSyncAt).toLocaleString('fr-FR')}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleForceSync()}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-white hover:bg-gray-50 text-foreground transition-colors disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Synchroniser
            </button>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
            >
              {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
              Deconnecter
            </button>
          </div>

          {/* Reconnect prompt if inactive */}
          {!isActive && (
            <div className="flex gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p>
                  Votre connexion Google Calendar a expire.{' '}
                  <button
                    type="button"
                    onClick={handleConnect}
                    className="text-primary font-medium hover:underline"
                  >
                    Reconnecter
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add to practice settings page**

In `apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx`, import and add after `AvailabilityManager`:

```typescript
import { CalendarSyncSettings } from '@/components/settings/calendar-sync-settings';

// In the JSX, after <AvailabilityManager>:
<CalendarSyncSettings token={token} />
```

- [ ] **Step 4: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api/calendar-sync.ts apps/web/src/components/settings/calendar-sync-settings.tsx apps/web/src/app/\(dashboard\)/dashboard/settings/practice/page.tsx
git commit -m "feat(frontend): add Google Calendar sync settings section"
```

---

## Task 10: Calendar View — Display External Events

**Files:**
- Modify: `apps/web/src/components/calendar/calendar-content.tsx`

- [ ] **Step 1: Add external events query**

Add a new React Query alongside the existing appointments query:

```typescript
const { data: externalEvents = [] } = useQuery({
  queryKey: ['external-calendar-events', year, month],
  queryFn: () =>
    apiClient.get<Array<{
      id: string;
      title: string | null;
      startAt: string;
      endAt: string;
      isAllDay: boolean;
    }>>(
      `/calendar-sync/external-events?from=${from}&to=${to}`,
      session?.accessToken,
    ),
  enabled: !!session?.accessToken,
});
```

Note: The `GET /calendar-sync/external-events` endpoint was already added in Task 7.

- [ ] **Step 2: Render external events in the calendar grid**

In the day cell rendering, after showing appointments, add external events:

```typescript
{/* External Google events */}
{externalEvents
  .filter(e => isSameDay(new Date(e.startAt), cellDate))
  .map(e => (
    <div
      key={`ext-${e.id}`}
      className="text-[10px] leading-tight truncate px-1 py-0.5 rounded bg-gray-100 text-gray-500 border border-dashed border-gray-300"
      title={`Google Calendar: ${e.title || 'Occupe'}`}
    >
      {!e.isAllDay && (
        <span className="font-medium">
          {new Date(e.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}{' '}
      {e.title || 'Occupe'}
    </div>
  ))}
```

- [ ] **Step 3: Show external events in selected day panel**

In the selected day appointments panel, add a section for external events:

```typescript
{/* External events for selected day */}
{externalEvents
  .filter(e => isSameDay(new Date(e.startAt), selectedDate))
  .map(e => (
    <div key={`ext-detail-${e.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200">
      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">
          {e.title || 'Occupe'}
        </p>
        <p className="text-xs text-gray-400">
          {e.isAllDay
            ? 'Toute la journee'
            : `${new Date(e.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(e.endAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
      </div>
      <span className="text-[10px] text-gray-400">Google</span>
    </div>
  ))}
```

- [ ] **Step 4: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/calendar/ apps/api/src/calendar-sync/
git commit -m "feat(calendar): display external Google Calendar events in calendar grid and day panel"
```

---

## Task 11: Final Verification + Plan Guard

**Files:**
- Modify: `apps/api/src/billing/guards/subscription.guard.ts` (if needed)

- [ ] **Step 1: Verify backend compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Verify Prisma schema is valid**

Run: `cd apps/api && npx prisma validate`
Expected: No errors

- [ ] **Step 4: Build shared-types**

Run: `cd packages/shared-types && npm run build`
Expected: No errors

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "feat(google-calendar): final verification and cleanup"
```
