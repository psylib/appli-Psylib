# Realtime Notifications & Event Triggers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add realtime WebSocket notifications and wire missing event triggers (appointments, sessions, AI, messaging) across all channels (in-app, email, push).

**Architecture:** A new `NotificationGateway` (Socket.io namespace `/notifications`) pushes notifications in realtime. `NotificationsService.createAndDispatch()` orchestrates: DB insert → WebSocket emit → email/push per user preferences. Frontend switches from polling to a `useNotifications()` hook connected via Socket.io.

**Tech Stack:** NestJS WebSocket Gateway (Socket.io), Keycloak JWKS JWT validation, Resend (email), Expo (push), Next.js React hook

**Key Design Decisions:**
- **JWT expiry:** Frontend Socket.io client reconnects automatically on disconnect. The `useNotifications()` hook passes a fresh `accessToken` on each reconnect attempt. Fallback polling (60s) catches any notifications missed during reconnection window.
- **Error isolation:** All channel dispatches (email, push) use `void` fire-and-forget with try/catch — failures never block the caller or each other.
- **CORS:** Gateway uses `getAllowedOrigins()` from `common/cors.config.ts` (same as MessagingGateway) — never wildcard `*` (HDS compliance).
- **Existing callers:** `createNotification()` stays as-is for backward compat. New triggers use `createAndDispatch()`. Existing callers (network, waitlist, mon-soutien-psy) can be migrated later.
- **PushService data type:** `data` param cast to `Record<string, string>` before passing to PushService (href is always a string).

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| **Create** | `apps/api/src/notifications/notification.gateway.ts` | Socket.io `/notifications` namespace, JWT auth, room management, emit to users |
| **Create** | `apps/api/src/notifications/__tests__/notification.gateway.spec.ts` | Unit tests for gateway |
| **Create** | `apps/web/src/hooks/use-notifications.ts` | Frontend hook: Socket.io connection + fallback polling |
| **Modify** | `apps/api/src/notifications/notifications.service.ts` | Add `createAndDispatch()` method — orchestrates in-app + email + push |
| **Modify** | `apps/api/src/notifications/__tests__/notifications.service.spec.ts` | Tests for `createAndDispatch()` |
| **Modify** | `apps/api/src/notifications/notifications.module.ts` | Register `NotificationGateway` |
| **Modify** | `apps/api/src/appointments/appointments.service.ts` | Add notification triggers on create/cancel |
| **Modify** | `apps/api/src/sessions/sessions.service.ts` | Add notification trigger on session completed |
| **Modify** | `apps/api/src/ai/ai.service.ts` | Add notification trigger on AI summary ready |
| **Modify** | `apps/api/src/messaging/messaging.gateway.ts` | Add offline notification for new messages |
| **Modify** | `apps/web/src/components/layouts/notification-bell.tsx` | Switch from polling to `useNotifications()` hook |
| **Modify** | `apps/web/src/app/(dashboard)/dashboard/notifications/page.tsx` | Switch from manual fetch to `useNotifications()` hook |

---

### Task 1: NotificationGateway — WebSocket Server

**Files:**
- Create: `apps/api/src/notifications/notification.gateway.ts`
- Create: `apps/api/src/notifications/__tests__/notification.gateway.spec.ts`
- Modify: `apps/api/src/notifications/notifications.module.ts`

- [ ] **Step 1: Write the unit test for NotificationGateway**

```typescript
// apps/api/src/notifications/__tests__/notification.gateway.spec.ts
import { Test } from '@nestjs/testing';
import { NotificationGateway } from '../notification.gateway';
import { ConfigService } from '@nestjs/config';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationGateway,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'KEYCLOAK_URL') return 'https://auth.test.local';
              if (key === 'KEYCLOAK_REALM') return 'test-realm';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    gateway = module.get(NotificationGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('sendToUser emits notification event to user room', () => {
    const mockServer = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
    (gateway as any).server = mockServer;

    const notification = { id: '1', type: 'test', title: 'Test', body: 'Body', readAt: null, createdAt: new Date().toISOString() };
    gateway.sendToUser('user-123', notification);

    expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
    expect(mockServer.to('user:user-123').emit).toHaveBeenCalledWith('notification', notification);
  });

  it('isUserOnline returns false when no server', () => {
    expect(gateway.isUserOnline('user-123')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npx vitest run src/notifications/__tests__/notification.gateway.spec.ts`
Expected: FAIL — `notification.gateway` module not found

- [ ] **Step 3: Create NotificationGateway**

```typescript
// apps/api/src/notifications/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import JwksClient from 'jwks-rsa';
import { getAllowedOrigins } from '../common/cors.config';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

interface JwtTokenPayload {
  sub: string;
  exp?: number;
}

@WebSocketGateway({
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private jwksClient!: JwksClient.JwksClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL', 'https://auth.psylib.eu');
    const keycloakRealm = this.configService.get<string>('KEYCLOAK_REALM', 'psyscale');
    const jwksUri = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`;

    this.jwksClient = JwksClient({
      jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
    });

    this.logger.log(`[WS/notifications] JWKS client initialisé — ${jwksUri}`);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.verifyToken(token);
      if (!payload?.sub) {
        client.disconnect(true);
        return;
      }

      const authSocket = client as AuthenticatedSocket;
      authSocket.userId = payload.sub;

      // Join personal room for targeted notifications
      await client.join(`user:${payload.sub}`);

      this.logger.log(`[WS/notifications] Connected: ${client.id} (userId: ${payload.sub})`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`[WS/notifications] Disconnected: ${client.id}`);
  }

  /**
   * Send a notification to a specific user via WebSocket.
   * Called by NotificationsService after DB insert.
   */
  sendToUser(userId: string, notification: Record<string, unknown>): void {
    this.server?.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Check if a user has active WebSocket connections.
   */
  isUserOnline(userId: string): boolean {
    if (!this.server) return false;
    const room = this.server.adapter.rooms?.get(`user:${userId}`);
    return !!room && room.size > 0;
  }

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake.auth as Record<string, unknown>)?.token;
    if (typeof authToken === 'string' && authToken) return authToken;

    const authHeader = client.handshake.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return null;
  }

  private async verifyToken(token: string): Promise<JwtTokenPayload | null> {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') return null;

      const kid = decoded.header.kid;
      const signingKey = await this.jwksClient.getSigningKey(kid);
      const publicKey = signingKey.getPublicKey();

      return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtTokenPayload;
    } catch {
      return null;
    }
  }
}
```

- [ ] **Step 4: Register gateway in module**

In `apps/api/src/notifications/notifications.module.ts`, add `NotificationGateway` to providers and exports:

```typescript
import { NotificationGateway } from './notification.gateway';

@Module({
  controllers: [NotificationsController],
  providers: [EmailService, SmsService, NotificationsService, EmailSequenceService, LeadNurtureSequenceService, PushService, NotificationGateway],
  exports: [EmailService, SmsService, NotificationsService, LeadNurtureSequenceService, PushService, NotificationGateway],
})
export class NotificationsModule {}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/api && npx vitest run src/notifications/__tests__/notification.gateway.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/notifications/notification.gateway.ts apps/api/src/notifications/__tests__/notification.gateway.spec.ts apps/api/src/notifications/notifications.module.ts
git commit -m "feat(notifications): add WebSocket NotificationGateway (/notifications namespace)"
```

---

### Task 2: NotificationsService — createAndDispatch()

**Files:**
- Modify: `apps/api/src/notifications/notifications.service.ts`
- Modify/Create: `apps/api/src/notifications/__tests__/notifications.service.spec.ts`

- [ ] **Step 1: Write the unit test for createAndDispatch()**

```typescript
// apps/api/src/notifications/__tests__/notifications.service.spec.ts
import { Test } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../common/prisma.service';
import { NotificationGateway } from '../notification.gateway';
import { EmailService } from '../email.service';
import { PushService } from '../push.service';

describe('NotificationsService.createAndDispatch', () => {
  let service: NotificationsService;
  let prisma: { notification: { create: jest.Mock }; user: { findUnique: jest.Mock; update: jest.Mock; }; };
  let gateway: { sendToUser: jest.Mock };
  let emailService: { sendNotificationEmail: jest.Mock };
  let pushService: { sendToUser: jest.Mock };

  beforeEach(async () => {
    prisma = {
      notification: { create: jest.fn() },
      user: { findUnique: jest.fn(), update: jest.fn() },
    };
    gateway = { sendToUser: jest.fn() };
    emailService = { sendNotificationEmail: jest.fn() };
    pushService = { sendToUser: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: gateway },
        { provide: EmailService, useValue: emailService },
        { provide: PushService, useValue: pushService },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('creates notification in DB and emits via WebSocket', async () => {
    const mockNotification = {
      id: 'notif-1', userId: 'user-1', type: 'appointment_update',
      title: 'Nouveau RDV', body: 'Test', data: null, readAt: null, createdAt: new Date(),
    };
    prisma.notification.create.mockResolvedValue(mockNotification);
    prisma.user.findUnique.mockResolvedValue({ notificationPreferences: null });

    const result = await service.createAndDispatch('user-1', 'appointment_update', 'Nouveau RDV', 'Test');

    expect(prisma.notification.create).toHaveBeenCalled();
    expect(gateway.sendToUser).toHaveBeenCalledWith('user-1', mockNotification);
    expect(result).toEqual(mockNotification);
  });

  it('sends email when preference is enabled', async () => {
    const mockNotification = {
      id: 'notif-1', userId: 'user-1', type: 'appointment_update',
      title: 'Test', body: 'Body', data: null, readAt: null, createdAt: new Date(),
    };
    prisma.notification.create.mockResolvedValue(mockNotification);
    prisma.user.findUnique.mockResolvedValue({
      notificationPreferences: { appointment_update: { email: true, push: false } },
    });

    await service.createAndDispatch('user-1', 'appointment_update', 'Test', 'Body');

    expect(emailService.sendNotificationEmail).toHaveBeenCalledWith('user-1', mockNotification);
    expect(pushService.sendToUser).not.toHaveBeenCalled();
  });

  it('skips email and push when preferences are disabled', async () => {
    const mockNotification = {
      id: 'notif-1', userId: 'user-1', type: 'ai_complete',
      title: 'Test', body: 'Body', data: null, readAt: null, createdAt: new Date(),
    };
    prisma.notification.create.mockResolvedValue(mockNotification);
    prisma.user.findUnique.mockResolvedValue({
      notificationPreferences: { ai_complete: { email: false, push: false } },
    });

    await service.createAndDispatch('user-1', 'ai_complete', 'Test', 'Body');

    expect(emailService.sendNotificationEmail).not.toHaveBeenCalled();
    expect(pushService.sendToUser).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npx vitest run src/notifications/__tests__/notifications.service.spec.ts`
Expected: FAIL — `createAndDispatch` not found, constructor doesn't accept gateway/email/push

- [ ] **Step 3: Implement createAndDispatch() in NotificationsService**

Update `apps/api/src/notifications/notifications.service.ts`:
- Inject `NotificationGateway`, `EmailService`, `PushService`
- Add `createAndDispatch()` method that:
  1. Creates notification in DB (existing `createNotification` logic)
  2. Emits via `gateway.sendToUser()`
  3. Reads user preferences
  4. If email enabled → `emailService.sendNotificationEmail()`
  5. If push enabled → `pushService.sendToUser()`

```typescript
// Add to constructor:
constructor(
  private readonly prisma: PrismaService,
  private readonly gateway: NotificationGateway,
  private readonly emailService: EmailService,
  private readonly pushService: PushService,
) {}

// New method:
async createAndDispatch(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  // 1. DB insert
  const notification = await this.createNotification(userId, type, title, body, data);

  // 2. Realtime push via WebSocket
  this.gateway.sendToUser(userId, notification);

  // 3. Check preferences and dispatch to other channels (fire-and-forget, error-isolated)
  try {
    const prefs = await this.getPreferences(userId) as Record<string, { email: boolean; push: boolean }>;
    const typePrefs = prefs[type] ?? { email: true, push: true };

    if (typePrefs.email) {
      void this.emailService.sendNotificationEmail(userId, notification).catch(() => {});
    }

    if (typePrefs.push) {
      const pushData = data ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)]),
      ) : undefined;
      void this.pushService.sendToUser(userId, { title, body, data: pushData }).catch(() => {});
    }
  } catch {
    // Non-blocking — preference/dispatch failures must never affect the caller
  }

  return notification;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && npx vitest run src/notifications/__tests__/notifications.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/notifications/notifications.service.ts apps/api/src/notifications/__tests__/notifications.service.spec.ts
git commit -m "feat(notifications): add createAndDispatch() — orchestrates in-app + WebSocket + email + push"
```

---

### Task 3: EmailService — sendNotificationEmail()

**Files:**
- Modify: `apps/api/src/notifications/email.service.ts`

- [ ] **Step 1: Add sendNotificationEmail method to EmailService**

This is a generic fallback email for notification types that don't have a specific template. It uses the existing `emailLayout()` wrapper and sends a simple notification email with the title and body.

```typescript
// Add to email.service.ts:
async sendNotificationEmail(
  userId: string,
  notification: { type: string; title: string; body: string; data?: Record<string, unknown> | null },
): Promise<void> {
  try {
    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user?.email) return;

    const href = typeof notification.data?.href === 'string'
      ? `${this.frontendUrl}${notification.data.href}`
      : this.frontendUrl;

    await this.send({
      to: user.email,
      subject: notification.title,
      html: this.emailLayout(`
        <h2 style="color: #1E1B4B; font-size: 20px; margin-bottom: 16px;">${notification.title}</h2>
        <p style="color: #444; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${notification.body}</p>
        <div style="text-align: center;">
          <a href="${href}"
             style="display: inline-block; background-color: #3D52A0; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Voir sur PsyLib
          </a>
        </div>
      `),
    });
  } catch (error) {
    this.logger.error(`Failed to send notification email to user ${userId}:`, error);
  }
}
```

- [ ] **Step 2: Verify EmailService compiles**

Run: `cd apps/api && npx tsc --noEmit --pretty`
Expected: No errors related to email.service.ts

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/notifications/email.service.ts
git commit -m "feat(notifications): add generic sendNotificationEmail() to EmailService"
```

---

### Task 4: Frontend — useNotifications() Hook

**Files:**
- Create: `apps/web/src/hooks/use-notifications.ts`

- [ ] **Step 1: Create the useNotifications hook**

Pattern follows existing `use-messaging.ts` — Socket.io connection with JWT auth, plus fallback polling.

```typescript
// apps/web/src/hooks/use-notifications.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch notifications from REST API
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as Notification[];
      setNotifications(data);
    } catch {
      // silent
    }
  }, [token]);

  // Socket.io connection for realtime updates
  useEffect(() => {
    if (!token) return;

    const socket = io(`${API_BASE}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    // On reconnect, pass fresh token (handles JWT expiry)
    socket.io.on('reconnect_attempt', () => {
      socket.auth = { token: session?.accessToken };
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  // Initial fetch + fallback polling (60s — reduced from 30s since WebSocket handles most)
  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark single as read
  const markRead = useCallback(async (id: string) => {
    if (!token) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    try {
      await fetch(`${API_BASE}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* optimistic */ }
  }, [token]);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    if (!token) return;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    try {
      await fetch(`${API_BASE}/api/v1/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* optimistic */ }
  }, [token]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    if (!token) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`${API_BASE}/api/v1/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* optimistic */ }
  }, [token]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markRead,
    markAllRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/hooks/use-notifications.ts
git commit -m "feat(notifications): add useNotifications() hook with WebSocket + fallback polling"
```

---

### Task 5: Frontend — NotificationBell Refactor

**Files:**
- Modify: `apps/web/src/components/layouts/notification-bell.tsx`

- [ ] **Step 1: Refactor NotificationBell to use useNotifications()**

Replace the internal polling logic with `useNotifications()`. Remove:
- `fetchNotifications` function
- 30s `setInterval`
- `isLoading` state (notifications arrive via hook)
- Local `markRead`, `markAllRead` (use hook's versions)

Keep the UI unchanged — only swap the data source.

Key changes:
```typescript
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Remove: fetchNotifications, useEffect polling, local state
  // Keep: isOpen, outside click handler, UI render logic
  // Replace: local markRead/markAllRead with hook versions
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/web && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layouts/notification-bell.tsx
git commit -m "refactor(notifications): NotificationBell uses useNotifications() hook — realtime"
```

---

### Task 6: Frontend — Notifications Page Refactor

**Files:**
- Modify: `apps/web/src/app/(dashboard)/dashboard/notifications/page.tsx`

- [ ] **Step 1: Refactor notifications page to use useNotifications()**

Same pattern as NotificationBell. Replace:
- `fetchNotifications` function
- `useEffect` for initial fetch
- Local `markRead`, `markAllRead`, `deleteNotification`

With `useNotifications()` hook values.

Keep: filter tabs, UI, deleteAll (bulk delete stays local since hook exposes single delete).

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/web && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(dashboard)/dashboard/notifications/page.tsx
git commit -m "refactor(notifications): notifications page uses useNotifications() hook — realtime"
```

---

### Task 7: Backend Triggers — Appointments

**Files:**
- Modify: `apps/api/src/appointments/appointments.service.ts`

- [ ] **Step 1: Inject NotificationsService into AppointmentsService**

Add `NotificationsService` to constructor (already imported via `NotificationsModule` in `AppointmentsModule`).

```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly audit: AuditService,
  private readonly email: EmailService,
  @Inject(forwardRef(() => StripeService))
  private readonly stripeService: StripeService,
  @Inject(forwardRef(() => WaitlistService))
  private readonly waitlistService: WaitlistService,
  private readonly notifications: NotificationsService,
) {}
```

- [ ] **Step 2: Add notification in create() method**

After appointment creation and email sending, add notification for the psychologist:

```typescript
// After the appointment is created in create():
// Notify psychologist (in-app + channels)
const psyUser = await this.prisma.psychologist.findUnique({
  where: { id: psy.id },
  select: { userId: true },
});
if (psyUser) {
  void this.notifications.createAndDispatch(
    psyUser.userId,
    'appointment_update',
    'Nouveau rendez-vous',
    `RDV avec ${patient.name} le ${new Date(dto.scheduledAt).toLocaleDateString('fr-FR')} à ${new Date(dto.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    { href: '/dashboard/calendar' },
  );
}
```

- [ ] **Step 3: Add notification in cancel() method**

After appointment cancellation:

```typescript
// After cancel — notify psy
const psyUser = await this.prisma.psychologist.findUnique({
  where: { id: psy.id },
  select: { userId: true },
});
if (psyUser) {
  const patient = await this.prisma.patient.findUnique({
    where: { id: existing.patientId },
    select: { name: true },
  });
  void this.notifications.createAndDispatch(
    psyUser.userId,
    'appointment_update',
    'RDV annulé',
    `Le rendez-vous avec ${patient?.name ?? 'un patient'} a été annulé`,
    { href: '/dashboard/calendar' },
  );
}
```

- [ ] **Step 4: Add notification in cancelByToken() — patient-initiated cancellation**

After the existing `sendCancellationNotification` email, add in-app notification for the psy:

```typescript
// In cancelByToken(), after the email notification:
void this.notifications.createAndDispatch(
  appointment.psychologist.user.id,
  'appointment_update',
  'RDV annulé par le patient',
  `${appointment.patient.name} a annulé son RDV du ${appointment.scheduledAt.toLocaleDateString('fr-FR')}${refunded ? ' (remboursé)' : ''}`,
  { href: '/dashboard/calendar' },
);
```

Note: `cancelByToken` already has access to `appointment.psychologist.user` via the include query at line 240-246.

- [ ] **Step 5: Verify it compiles**

Run: `cd apps/api && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/appointments/appointments.service.ts
git commit -m "feat(notifications): add in-app triggers for appointment create/cancel"
```

---

### Task 8: Backend Triggers — Sessions

**Files:**
- Modify: `apps/api/src/sessions/sessions.service.ts`

- [ ] **Step 1: Inject NotificationsService**

Add to constructor:

```typescript
import { NotificationsService } from '../notifications/notifications.service';

// In constructor:
private readonly notifications: NotificationsService,
```

Also add `NotificationsModule` to `SessionsModule` imports if not already there.

- [ ] **Step 2: Add notification on session completed**

In `update()`, inside the `if (dto.status === 'completed')` block (around line 242), after the invoice logic:

```typescript
// Notify psy that session is completed
const patient = await this.prisma.patient.findUnique({
  where: { id: existing.patientId },
  select: { name: true },
});
void this.notifications.createAndDispatch(
  psy.userId,
  'session_update',
  'Séance terminée',
  `Séance avec ${patient?.name ?? 'un patient'} enregistrée`,
  { href: `/dashboard/sessions/${sessionId}` },
);
```

Note: This code goes at the bottom of the `if (dto.status === 'completed')` block, after the invoice queue logic, and `psy` is already available from `getPsychologist()` call at line 183. We need `psy.userId` — currently the method has `psychologistUserId` param which is the userId.

Simpler version:

```typescript
// In update(), inside if (dto.status === 'completed'), after invoice logic:
const completedPatient = await this.prisma.patient.findUnique({
  where: { id: existing.patientId },
  select: { name: true },
});
void this.notifications.createAndDispatch(
  psychologistUserId, // this is already the user ID
  'session_update',
  'Séance terminée',
  `Séance avec ${completedPatient?.name ?? 'un patient'} enregistrée`,
  { href: `/dashboard/sessions/${sessionId}` },
);
```

- [ ] **Step 3: Update SessionsModule imports**

Check `apps/api/src/sessions/sessions.module.ts` — add `NotificationsModule` to imports if not present.

- [ ] **Step 4: Verify it compiles**

Run: `cd apps/api && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/sessions/sessions.service.ts apps/api/src/sessions/sessions.module.ts
git commit -m "feat(notifications): add in-app trigger for session completed"
```

---

### Task 9: Backend Triggers — AI Summary

**Files:**
- Modify: `apps/api/src/ai/ai.service.ts`

- [ ] **Step 1: Inject NotificationsService into AiService**

```typescript
import { NotificationsService } from '../notifications/notifications.service';

// In constructor:
private readonly notifications: NotificationsService,
```

Add `NotificationsModule` to `AiModule` imports.

- [ ] **Step 2: Add notification after AI summary completes**

In `streamSessionSummary()`, after the `trackUsage()` call (around line 306), before the `finally` block:

```typescript
// Notify psy that AI summary is ready
void this.notifications.createAndDispatch(
  psychologistUserId,
  'ai_complete',
  'Résumé IA prêt',
  'Le résumé de la séance est disponible',
  { href: `/dashboard/sessions/${dto.sessionId}` },
);
```

Note: This must be inside the `try` block, after `trackUsage` and the extraction phase (around line 315), so the notification only fires when the summary actually completed.

- [ ] **Step 3: Update AiModule imports**

Check `apps/api/src/ai/ai.module.ts` — add `NotificationsModule` to imports.

- [ ] **Step 4: Verify it compiles**

Run: `cd apps/api && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/ai/ai.service.ts apps/api/src/ai/ai.module.ts
git commit -m "feat(notifications): add in-app trigger for AI summary ready"
```

---

### Task 10: Backend Triggers — Messaging (offline)

**Files:**
- Modify: `apps/api/src/messaging/messaging.gateway.ts`

- [ ] **Step 1: Inject NotificationsService and NotificationGateway**

```typescript
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationGateway } from '../notifications/notification.gateway';

// In constructor:
private readonly notifications: NotificationsService,
private readonly notificationGateway: NotificationGateway,
```

Add `NotificationsModule` to `MessagingModule` imports.

- [ ] **Step 2: Add offline notification in handleSendMessage()**

After the message is broadcast in the conversation room (around line 187), check if the recipient is connected to the `/notifications` namespace. If not, create a notification:

```typescript
// After server.to(room).emit('new_message', messageDto):

// Find the other participant in the conversation to send notification
try {
  const conversation = await this.messagingService.getConversation(conversationId);
  if (conversation) {
    const recipientUserId = conversation.psychologistUserId === authSocket.userId
      ? conversation.patientUserId
      : conversation.psychologistUserId;

    if (recipientUserId && !this.notificationGateway.isUserOnline(recipientUserId)) {
      void this.notifications.createAndDispatch(
        recipientUserId,
        'patient_message',
        'Nouveau message',
        content.trim().slice(0, 80) + (content.trim().length > 80 ? '...' : ''),
        { href: `/dashboard/messaging/${conversationId}` },
      );
    }
  }
} catch {
  // non-blocking — notification failure shouldn't affect message delivery
}
```

Note: This depends on `messagingService.getConversation()` existing. Check if the method exists — if not, add a simple one that returns the conversation participants' userIds. If the conversation model doesn't directly have user IDs, we may need to query through psychologist/patient tables.

- [ ] **Step 3: Update MessagingModule imports**

Add `NotificationsModule` to `MessagingModule` imports.

- [ ] **Step 4: Verify it compiles**

Run: `cd apps/api && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/messaging/messaging.gateway.ts apps/api/src/messaging/messaging.module.ts
git commit -m "feat(notifications): add offline notification for new messages"
```

---

### Task 11: Add New Preference Types

**Files:**
- Modify: `apps/api/src/notifications/notifications.service.ts`

- [ ] **Step 1: Update defaultPreferences() to include new types**

```typescript
private defaultPreferences() {
  return {
    session_reminder: { email: true, push: true },
    patient_message: { email: true, push: true },
    mood_alert: { email: true, push: true },
    ai_complete: { email: false, push: true },
    payment: { email: true, push: false },
    // New types
    appointment_update: { email: true, push: true },
    session_update: { email: false, push: false },
    patient_update: { email: true, push: true },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/notifications/notifications.service.ts
git commit -m "feat(notifications): add appointment_update, session_update, patient_update preference types"
```

---

### Task 12: Integration Test — Full Flow

- [ ] **Step 1: Manual smoke test**

Start the dev server and verify:
1. Open browser to `/dashboard` — check NotificationBell connects to `/notifications` WebSocket (check browser DevTools Network > WS)
2. Create an appointment — verify notification appears instantly in bell (no 30s delay)
3. Cancel an appointment — verify notification appears
4. Open `/dashboard/notifications` — verify list updates in realtime
5. Mark a notification as read — verify it updates

- [ ] **Step 2: Run existing test suite**

Run: `cd apps/api && npx vitest run`
Expected: All tests pass (no regressions)

- [ ] **Step 3: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix(notifications): integration fixes from smoke testing"
```
