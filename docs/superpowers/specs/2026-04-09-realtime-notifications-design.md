# Realtime Notifications & Event Triggers

**Date:** 2026-04-09
**Status:** Draft
**Scope:** WebSocket realtime notifications + missing event triggers

---

## Context

PsyLib has a mature notification infrastructure:
- **EmailService** (Resend) — 20+ HTML templates
- **ReminderService** — cron-based appointment reminders (email + SMS)
- **PushService** — Expo push notifications
- **SmsService** — OVH SMS API
- **NotificationsService** — in-app DB CRUD
- **NotificationBell** — polling every 30s
- **/dashboard/notifications** — full page with filters

**Two gaps remain:**
1. In-app notifications use polling (30s delay) — Socket.io exists for messaging but not for notifications
2. `createNotification()` is only called in 3 services (network, waitlist, mon-soutien-psy) — many business events don't trigger notifications

---

## A. Realtime WebSocket Notifications

### Backend: NotificationGateway

Create a dedicated Socket.io namespace `/notifications` (separate from `/messaging`):

```
File: apps/api/src/notifications/notification.gateway.ts

@WebSocketGateway({ namespace: '/notifications', cors: { origin: getAllowedOrigins(), credentials: true } })
export class NotificationGateway {
  @WebSocketServer() server: Server;

  // Room pattern: `user:{userId}`
  handleConnection(client) → validate JWT → join room `user:{userId}`

  // Called by NotificationsService after DB insert
  sendToUser(userId: string, notification: Notification) →
    server.to(`user:${userId}`).emit('notification', notification)
}
```

JWT validation reuses the same Keycloak JWKS pattern as `MessagingGateway`.

### Backend: NotificationsService Enhancement

After `createNotification()` inserts into DB:
1. Emit via `NotificationGateway.sendToUser()` → instant in-app
2. Check user preferences → if email enabled → `EmailService`
3. Check user preferences → if push enabled → `PushService`

```typescript
// notifications.service.ts — enhanced createNotification()
async createAndDispatch(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<Notification> {
  // 1. DB insert
  const notification = await this.prisma.notification.create({ ... });

  // 2. Realtime push
  this.gateway.sendToUser(userId, notification);

  // 3. Check preferences & dispatch channels
  const prefs = await this.getPreferences(userId);
  const typePrefs = prefs[type] ?? { email: true, push: true };

  if (typePrefs.email) {
    await this.emailService.sendNotificationEmail(userId, notification);
  }
  if (typePrefs.push) {
    await this.pushService.sendToUser(userId, { title, body, data });
  }

  return notification;
}
```

### Frontend: useNotifications Hook

```
File: apps/web/src/hooks/use-notifications.ts

export function useNotifications() {
  // 1. Connect to Socket.io /notifications namespace with JWT
  // 2. Listen for 'notification' events → prepend to local state
  // 3. Fallback: poll every 60s (increased from 30s since realtime handles most cases)
  // 4. Return: { notifications, unreadCount, markRead, markAllRead }
}
```

### Frontend: NotificationBell Update

- Replace direct polling with `useNotifications()` hook
- Remove the 30s setInterval
- Socket handles instant updates; fallback polling at 60s for reconnection resilience

### Frontend: /dashboard/notifications Page Update

- Also use `useNotifications()` hook for consistency
- New notifications appear instantly at top of list

---

## B. Missing Event Triggers

### Trigger Map

| Event | Service File | Type Key | In-app | Email | Push |
|---|---|---|---|---|---|
| Appointment created | appointments.service.ts | `appointment_created` | ✅ | ✅ `sendAppointmentConfirmation` | ✅ |
| Appointment cancelled | appointments.service.ts | `appointment_cancelled` | ✅ | ✅ `sendAppointmentCancellation` | ✅ |
| Appointment modified | appointments.service.ts | `appointment_modified` | ✅ | ✅ `sendAppointmentModified` | — |
| Session completed | sessions.service.ts | `session_completed` | ✅ | — | — |
| AI summary ready | ai.service.ts | `ai_complete` | ✅ | — | ✅ |
| Payment received | billing (webhook) | `payment` | ✅ | ✅ (receipt already sent) | — |
| Invitation accepted | invitations flow | `patient_invitation_accepted` | ✅ | ✅ | ✅ |
| New patient message | messaging.gateway.ts | `patient_message` | ✅ | ✅ (if offline >5min) | ✅ |

### Preference Types (existing + new)

```typescript
// Existing (already in preferences schema):
'session_reminder'    // Appointment reminder (cron — unchanged)
'patient_message'     // New message from patient
'mood_alert'          // Mood tracking alert
'ai_complete'         // AI summary/exercise done
'payment'             // Payment received

// New types to add:
'appointment_update'  // Created, modified, cancelled
'session_update'      // Session completed
'patient_update'      // Invitation accepted, new patient
```

### Implementation per trigger

**Appointments (create/cancel/modify):**
```typescript
// appointments.service.ts — after successful create
await this.notificationsService.createAndDispatch(
  psychologistUserId,
  'appointment_update',
  'Nouveau rendez-vous',
  `RDV avec ${patientName} le ${formatDate(scheduledAt)}`,
  { href: `/dashboard/calendar` },
);
```

**Session completed:**
```typescript
// sessions.service.ts — after status → completed
await this.notificationsService.createAndDispatch(
  psychologistUserId,
  'session_update',
  'Séance terminée',
  `Séance avec ${patientName} enregistrée`,
  { href: `/dashboard/sessions/${sessionId}` },
);
```

**AI summary ready:**
```typescript
// ai.service.ts — after summary generation complete
await this.notificationsService.createAndDispatch(
  psychologistUserId,
  'ai_complete',
  'Résumé IA prêt',
  `Le résumé de la séance avec ${patientName} est disponible`,
  { href: `/dashboard/sessions/${sessionId}` },
);
```

**New patient message (if offline):**
```typescript
// messaging.gateway.ts — after receiving message, if recipient not connected
await this.notificationsService.createAndDispatch(
  recipientUserId,
  'patient_message',
  `Message de ${senderName}`,
  truncate(messageContent, 80),
  { href: `/dashboard/messaging/${conversationId}` },
);
```

---

## C. Email Templates

One new generic method + one new specific template:

1. **sendNotificationEmail(userId, notification)** — Generic fallback email for any notification type (uses existing `emailLayout()` wrapper, fetches user email from DB, renders title + body + CTA link)
2. **sendPatientInvitationAccepted(data)** — "Votre patient a accepté l'invitation" (to psy) — specific template

Existing templates already cover: `sendAppointmentConfirmation`, `sendAppointmentReminder`, `sendCancellationNotification`, `sendBookingDeclined`, `sendInvoiceSent` — all remain unchanged.

---

## D. Files to Create/Modify

### New files
- `apps/api/src/notifications/notification.gateway.ts` — Socket.io /notifications namespace
- `apps/web/src/hooks/use-notifications.ts` — realtime notifications hook

### Modified files
- `apps/api/src/notifications/notifications.service.ts` — add `createAndDispatch()`, inject gateway
- `apps/api/src/notifications/notifications.module.ts` — register gateway
- `apps/api/src/notifications/email.service.ts` — add 3 new templates
- `apps/api/src/appointments/appointments.service.ts` — add notification triggers
- `apps/api/src/sessions/sessions.service.ts` — add notification trigger
- `apps/api/src/ai/ai.service.ts` — add notification trigger
- `apps/api/src/messaging/messaging.gateway.ts` — add offline notification trigger
- `apps/web/src/components/layouts/notification-bell.tsx` — use `useNotifications()` hook
- `apps/web/src/app/(dashboard)/dashboard/notifications/page.tsx` — use `useNotifications()` hook

---

## E. Non-Goals

- No new BullMQ queue — emails via Resend are fast enough synchronously
- No React Email migration — existing HTML templates work fine
- No new DB tables or schema changes — existing `Notification` model + preferences are sufficient
- No SMS triggers beyond existing appointment reminders (cron stays unchanged)

---

## F. HDS Compliance

- Socket.io JWT validation via Keycloak JWKS (same as messaging gateway)
- No patient data in push notification content (existing pattern)
- Notification content is non-sensitive (titles/bodies are generic, no clinical data)
- Audit logging not needed for notification reads (non-sensitive operations)
