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
- **Plan gating:** Solo, Pro, Clinic (Free excluded)
- **Security:** OAuth tokens encrypted AES-256-GCM, no patient data sent to Google beyond first name

## Data Model

### Table: `calendar_connections`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologistId` | uuid FK -> psychologists | unique |
| `provider` | enum `CalendarProvider` | `google` (extensible) |
| `accessToken` | text | Encrypted AES-256-GCM |
| `refreshToken` | text | Encrypted AES-256-GCM |
| `tokenExpiresAt` | timestamp | |
| `email` | text | Google account email for display |
| `calendarId` | text | Google calendar ID (default: `primary`) |
| `syncToken` | text | Incremental sync token from Google |
| `watchChannelId` | text | Push notification channel ID |
| `watchResourceId` | text | Push notification resource ID |
| `watchExpiration` | timestamp | Channel expiry (~7 days) |
| `lastSyncAt` | timestamp | |
| `isActive` | boolean | default true |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

### Table: `external_calendar_events`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `psychologistId` | uuid FK -> psychologists | |
| `calendarConnectionId` | uuid FK -> calendar_connections | |
| `externalId` | text | Google event ID |
| `title` | text | For display in PsyLib calendar |
| `startAt` | timestamp | |
| `endAt` | timestamp | |
| `isAllDay` | boolean | |
| `status` | text | `confirmed` / `tentative` / `cancelled` |
| `lastUpdatedAt` | timestamp | |

**Index:** `(psychologistId, startAt, endAt)` for availability queries.
**Unique constraint:** `(calendarConnectionId, externalId)` to prevent duplicates.

### Field added to `Appointment`:

`googleEventId` (text, nullable) — links a PsyLib appointment to its Google Calendar event.

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
8. Initial sync job queued (BullMQ): pull Google events for next 60 days
9. Push notification watch channel created
10. Redirect to frontend Settings with `?calendar=connected`

### Token Refresh

Before each Google API call:
1. Check `tokenExpiresAt` — if > 5 min remaining, proceed
2. If expired/expiring, use refresh_token to get new access_token
3. Update `accessToken` + `tokenExpiresAt` in DB
4. If refresh fails (token revoked), set `isActive: false`, notify psy via in-app notification

### Disconnection

1. Psy clicks "Deconnecter" in Settings
2. Backend: revoke Google token, stop watch channel, delete `calendar_connections` row
3. Delete all `external_calendar_events` for this psychologist
4. Remove `googleEventId` from all appointments (set null)

## Sync: PsyLib -> Google (outbound)

### Trigger

`AppointmentsService` emits events via `EventEmitter2`:
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
2. Google sends `POST /calendar-sync/google/webhook` when events change
3. Webhook handler:
   - Validate `X-Goog-Channel-ID` and `X-Goog-Resource-ID` against stored values
   - Queue incremental sync job in BullMQ
4. Incremental sync job:
   - Call `events.list` with stored `syncToken`
   - Upsert received events into `external_calendar_events`
   - Update `syncToken` for next sync
   - Delete events with `status: cancelled`

### Polling Fallback (every 15 min)

BullMQ repeatable job `calendar-sync-poll`:
- For each active `calendar_connections`:
  - Perform incremental sync (same as push handler)
  - Renew watch channels expiring within 24 hours

### Channel Renewal

Watch channels expire after ~7 days. The polling job checks `watchExpiration` and renews channels expiring within 24 hours by creating a new watch and updating stored channel ID/resource ID/expiration.

### Event Filtering

Events from Google are stored in `external_calendar_events` with the following rules:
- **All events block** availability (regardless of Google's free/busy transparency)
- Events with `status: cancelled` are deleted from `external_calendar_events`
- Events with `status: tentative` are stored but DO block (conservative approach)
- All-day events block the entire day
- **Skip events created by PsyLib** (identified by matching `googleEventId` in appointments table) to avoid circular blocking

## Availability Impact

### Modified: `getAvailableTimeslots()`

Current logic:
1. Get weekly availability slots
2. Get appointments in range
3. Exclude occupied windows (with break buffer)

**Added step:**
4. Query `external_calendar_events` for the date range (status != `cancelled`)
5. Exclude overlapping windows (same logic as appointments, with break buffer)

This impacts both the internal calendar and the public booking flow.

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

### Environment Variables

```env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://api.psylib.eu/calendar-sync/google/callback
```

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/calendar-sync/google/auth` | Keycloak | Start OAuth flow |
| GET | `/calendar-sync/google/callback` | Public (state JWT) | OAuth callback |
| GET | `/calendar-sync/status` | Keycloak | Get connection status |
| DELETE | `/calendar-sync/disconnect` | Keycloak | Disconnect + cleanup |
| POST | `/calendar-sync/google/webhook` | Public (channel validation) | Google push notification |
| POST | `/calendar-sync/force-sync` | Keycloak | Manual sync trigger |

## Plan Gating

- **Free:** No access. Button grayed with upgrade CTA.
- **Solo / Pro / Clinic:** Full access to Google Calendar sync.

Enforced in:
- `CalendarSyncController` with plan guard
- Frontend with feature lock component

## Security

- OAuth tokens encrypted AES-256-GCM (same as patient notes)
- No patient last names sent to Google (first name only in event title)
- Webhook endpoint validates channel ID + resource ID (no open endpoint)
- State parameter in OAuth flow is a signed JWT (CSRF protection)
- Token refresh failures logged in audit_logs

## Testing

- Unit tests: `CalendarSyncService` (mock Google API)
- Integration tests: OAuth flow, webhook processing, availability impact
- Manual E2E: Connect real Google account, create appointment, verify sync
