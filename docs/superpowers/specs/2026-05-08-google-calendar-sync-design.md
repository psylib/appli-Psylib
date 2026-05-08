# Google Calendar Sync — Design Spec

**Date:** 2026-05-08
**Status:** Approved
**Scope:** Bidirectional sync between PsyLib and Google Calendar

## Overview

Psychologists can connect their Google Calendar to PsyLib. Appointments created in PsyLib appear in Google Calendar, and Google Calendar events block availability in PsyLib's public booking system.

## Requirements

- **Direction:** Bidirectional (PsyLib <-> Google)
- **Blocking rule:** All Google events block PsyLib slots (regardless of free/busy status)
- **Sync method:** Push notifications (real-time) + polling every 15 min (fallback)
- **Plan gating:** Starter (Solo), Pro, Clinic (Free excluded)
- **Security:** OAuth tokens encrypted AES-256-GCM, no patient data sent to Google beyond first name

## Prerequisites — Codebase Modifications

### EventEmitter2 in AppointmentsService

The current `AppointmentsService` does not emit events. The following modifications are required as a prerequisite:

1. **Inject `EventEmitter2`** into `AppointmentsService` constructor
2. **Define event payload interface:**

```typescript
interface AppointmentEventPayload {
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

3. **Emit events** after each successful DB operation:
   - `appointment.created` — in `create()` and `createGroup()`
   - `appointment.updated` — in `update()`
   - `appointment.cancelled` — in `cancel()` and `cancelByToken()`

### PLAN_LIMITS entry

Add `calendarSync: boolean` to the `PLAN_LIMITS` constant in shared-types:

```typescript
free:    { calendarSync: false, ... }
starter: { calendarSync: true, ... }
pro:     { calendarSync: true, ... }
clinic:  { calendarSync: true, ... }
```

## Data Model

### Prisma Models

```prisma
enum CalendarProvider {
  google
  // extensible: outlook, apple
}

model CalendarConnection {
  id              String            @id @default(uuid())
  psychologistId  String            @unique @map("psychologist_id")
  provider        CalendarProvider  @default(google)
  accessToken     String            @map("access_token")      // ENCRYPTED AES-256-GCM
  refreshToken    String            @map("refresh_token")     // ENCRYPTED AES-256-GCM
  tokenExpiresAt  DateTime?         @map("token_expires_at")
  email           String?                                      // Google account email for display
  calendarId      String            @default("primary") @map("calendar_id")
  syncToken       String?           @map("sync_token")        // Google incremental sync token
  watchChannelId  String?           @map("watch_channel_id")
  watchResourceId String?           @map("watch_resource_id")
  watchToken      String?           @map("watch_token")       // Secret token for webhook auth
  watchExpiration DateTime?         @map("watch_expiration")
  lastSyncAt      DateTime?         @map("last_sync_at")
  isActive        Boolean           @default(true) @map("is_active")
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  psychologist          Psychologist              @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
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
  status                String             @default("confirmed")  // confirmed | tentative | cancelled
  lastUpdatedAt         DateTime?          @map("last_updated_at")
  createdAt             DateTime           @default(now()) @map("created_at")
  updatedAt             DateTime           @updatedAt @map("updated_at")

  psychologist          Psychologist              @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  calendarConnection    CalendarConnection        @relation(fields: [calendarConnectionId], references: [id], onDelete: Cascade)

  @@unique([calendarConnectionId, externalId])
  @@index([psychologistId, startAt, endAt])
  @@map("external_calendar_events")
}
```

### Fields added to existing models

**`Appointment` model** — add:
```prisma
googleEventId  String?  @map("google_event_id")
```

**`Psychologist` model** — add back-relations:
```prisma
calendarConnections    CalendarConnection[]
externalCalendarEvents ExternalCalendarEvent[]
```

### Shared Types (packages/shared-types)

Add to `index.ts`:

```typescript
export enum CalendarProvider {
  GOOGLE = 'google',
}

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

Add to `AuditAction` enum:
```typescript
CALENDAR_CONNECT = 'CALENDAR_CONNECT',
CALENDAR_DISCONNECT = 'CALENDAR_DISCONNECT',
```

## OAuth2 Flow

### Connection

1. Psy clicks "Connecter Google Calendar" in Settings > Cabinet
2. Frontend redirects to `GET /calendar-sync/google/auth`
3. Backend builds Google OAuth2 URL:
   - `scope`: `https://www.googleapis.com/auth/calendar.events` + `https://www.googleapis.com/auth/calendar.readonly`
   - `access_type`: `offline` (to get refresh_token)
   - `prompt`: `consent` (force refresh_token on reconnect)
   - `state`: signed JWT containing `psychologistId` (CSRF protection)
4. Google consent screen -> psy authorizes
5. Google redirects to `GET /calendar-sync/google/callback?code=...&state=...`
6. Backend exchanges code for access_token + refresh_token
7. Tokens encrypted with AES-256-GCM, stored in `calendar_connections`
8. Initial sync job queued (BullMQ): pull Google events for next 90 days
9. Push notification watch channel created (with secret `watchToken` for authentication)
10. Log `CONNECT` action in `audit_logs` (entity_type: `calendar_connection`)
11. Redirect to frontend Settings with `?calendar=connected`

### Token Refresh

Before each Google API call:
1. Check `tokenExpiresAt` — if > 5 min remaining, proceed
2. If expired/expiring, use refresh_token to get new access_token
3. Update `accessToken` + `tokenExpiresAt` in DB
4. If refresh fails (token revoked), set `isActive: false`, notify psy via in-app notification, log in `audit_logs`

### Disconnection

1. Psy clicks "Deconnecter" in Settings
2. Backend: revoke Google token, stop watch channel, delete `calendar_connections` row
3. Cascade delete removes all `external_calendar_events` automatically (onDelete: Cascade)
4. Remove `googleEventId` from all appointments (set null)
5. Log `DISCONNECT` action in `audit_logs` (entity_type: `calendar_connection`)

## Sync: PsyLib -> Google (outbound)

### Trigger

`AppointmentsService` emits events via `EventEmitter2` (see Prerequisites section):
- `appointment.created` -> create Google event
- `appointment.updated` -> update Google event
- `appointment.cancelled` -> delete Google event

### Listener

`CalendarSyncService` listens via `@OnEvent()` decorators. Processing is async (fire-and-forget, does not block the API response).

### Google Event Content

- **Title:** `"Consultation - [Patient first name]"` (no last name for HDS compliance)
- **Time:** `scheduledAt` to `scheduledAt + duration`
- **Description:** Link to appointment in PsyLib dashboard
- **Color:** Mapped from consultation type color (Google Calendar colorId)
- **Reminders:** None (PsyLib handles its own reminders)

### Error Handling

- If Google API call fails: enqueue retry job in BullMQ (3 retries, exponential backoff: 30s, 2min, 10min)
- If connection is inactive: skip silently
- If token refresh fails during event creation: mark connection inactive, notify psy

### Stored Reference

On successful creation, store `googleEventId` in `appointment.googleEventId` for future updates/deletes.

## Sync: Google -> PsyLib (inbound)

### Push Notifications (real-time)

1. After OAuth connection, create a watch channel: `POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/watch`
   - Include `token` field (secret `watchToken`) for webhook authentication
2. Google sends `POST /calendar-sync/google/webhook` when events change
3. Webhook handler:
   - Validate `X-Goog-Channel-ID` against stored `watchChannelId`
   - Validate `X-Goog-Channel-Token` against stored `watchToken` (cryptographic auth)
   - Deduplicate: use BullMQ `jobId` = `sync-${connectionId}-${timestamp_5s_bucket}` to prevent burst processing
   - Queue incremental sync job in BullMQ
4. Incremental sync job:
   - Call `events.list` with stored `syncToken`
   - Upsert received events into `external_calendar_events` (recurring event instances are stored as individual rows)
   - Update `syncToken` for next sync
   - Delete events with `status: cancelled`
   - Skip events whose `id` matches any `appointment.googleEventId` (prevent circular blocking)

### Polling Fallback (every 15 min)

BullMQ repeatable job `calendar-sync-poll`:
- For each active `calendar_connections`:
  - Perform incremental sync (same as push handler)
  - Renew watch channels expiring within 24 hours

### Channel Renewal

Watch channels expire after ~7 days. The polling job checks `watchExpiration` and renews channels expiring within 24 hours by creating a new watch and updating stored channel ID/resource ID/token/expiration.

### Event Filtering

Events from Google are stored in `external_calendar_events` with the following rules:
- **All events block** availability (regardless of Google's free/busy transparency)
- Events with `status: cancelled` are deleted from `external_calendar_events`
- Events with `status: tentative` are stored but DO block (conservative approach)
- All-day events block the entire day
- **Recurring events:** individual instances are stored as separate rows (Google's `events.list` with `syncToken` returns individual instances)
- **Skip events created by PsyLib** (identified by matching `googleEventId` in appointments table) to avoid circular blocking

## Availability Impact

### Modified: `getAvailableTimeslots()`

Current logic:
1. Get weekly availability slots
2. Get appointments in range
3. Fetch `minBreakMinutes` from psychologist
4. Exclude occupied windows (appointment + break buffer)

**Added steps (after step 2):**

```
2b. Query external_calendar_events for the date range:
    WHERE psychologistId = :psychologistId
    AND status != 'cancelled'
    AND (
      (startAt < :rangeTo AND endAt > :rangeFrom)  -- overlaps range
      OR isAllDay = true                             -- all-day in range
    )

In the per-day slot generation loop:
  - For all-day external events: skip the entire day (short-circuit inner loop)
  - For timed external events: exclude [startAt - breakBuffer, endAt + breakBuffer]
    (same logic as appointments, break buffer = minBreakMinutes)
```

This impacts both the internal calendar and the public booking flow (which calls `getAvailableTimeslots()`).

## Frontend

### Settings > Cabinet — "Calendriers connectes" section

**Disconnected state:**
- Google Calendar icon + "Connecter Google Calendar" button
- Plan-gated: Free plan shows grayed button with "Disponible a partir du plan Solo"

**Connected state:**
- Green badge "Connecte" + Google account email
- "Derniere sync: il y a X minutes"
- "Deconnecter" button (with confirmation dialog)

### Calendar View

- External Google events displayed in the calendar grid
- Visual distinction: gray/semi-transparent background, dashed border
- Label: event title (or "Occupe" if title is empty/null)
- Not clickable (read-only, external event)
- Tooltip on hover: "Evenement Google Calendar"

## Architecture

### Module: `CalendarSyncModule`

```
apps/api/src/calendar-sync/
├── calendar-sync.module.ts           — Module definition
├── calendar-sync.controller.ts       — OAuth routes + webhook
├── calendar-sync.service.ts          — Orchestration (connect, disconnect, sync)
├── google-calendar.provider.ts       — Google Calendar API v3 wrapper
├── calendar-sync.processor.ts        — BullMQ job processor
├── dto/
│   └── calendar-sync.dto.ts          — Validation DTOs
└── calendar-sync.constants.ts        — Scopes, color mappings
```

### Dependencies

- `googleapis` (npm) — Google Calendar API client
- `BullMQ` — Job queue for async sync + retry
- `EncryptionService` — Token encryption
- `EventEmitter2` — Listen to appointment events
- `NotificationService` — Notify psy on connection issues
- `AuditService` — Log connect/disconnect/token failures

### Environment Variables

```env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://api.psylib.eu/calendar-sync/google/callback
```

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/calendar-sync/google/auth` | Keycloak + plan guard | Start OAuth flow |
| GET | `/calendar-sync/google/callback` | Public (state JWT) | OAuth callback |
| GET | `/calendar-sync/status` | Keycloak | Get connection status |
| DELETE | `/calendar-sync/disconnect` | Keycloak | Disconnect + cleanup |
| POST | `/calendar-sync/google/webhook` | Public (channel token) | Google push notification |
| POST | `/calendar-sync/force-sync` | Keycloak | Manual sync trigger |

## Plan Gating

- **Free:** No access. Button grayed with upgrade CTA.
- **Starter (Solo) / Pro / Clinic:** Full access to Google Calendar sync.

Enforced via `PLAN_LIMITS.calendarSync` in:
- `CalendarSyncController` with plan guard
- Frontend with feature lock component

## Security

- OAuth tokens encrypted AES-256-GCM (same as patient notes)
- No patient last names sent to Google (first name only in event title)
- Webhook authenticated via `X-Goog-Channel-Token` (secret token set during watch creation)
- Webhook deduplication via BullMQ jobId to prevent burst abuse
- State parameter in OAuth flow is a signed JWT (CSRF protection)
- Connect/disconnect/token failures logged in `audit_logs`

## Testing

- Unit tests: `CalendarSyncService` (mock Google API)
- Integration tests: OAuth flow, webhook processing, availability impact
- Manual E2E: Connect real Google account, create appointment, verify sync
