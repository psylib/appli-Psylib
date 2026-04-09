import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotificationsService } from '../notifications.service';

describe('NotificationsService.createAndDispatch', () => {
  let service: NotificationsService;
  let prisma: any;
  let gateway: any;
  let emailService: any;
  let pushService: any;

  beforeEach(() => {
    prisma = {
      notification: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn() },
      user: { findUnique: vi.fn(), update: vi.fn() },
    };
    gateway = { sendToUser: vi.fn() };
    emailService = { sendNotificationEmail: vi.fn().mockResolvedValue(undefined) };
    pushService = { sendToUser: vi.fn().mockResolvedValue(true) };

    service = new NotificationsService(prisma, gateway, emailService, pushService);
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

  it('sends email when preference is enabled and user has email', async () => {
    const mockNotification = {
      id: 'notif-1', userId: 'user-1', type: 'appointment_update',
      title: 'Test', body: 'Body', data: null, readAt: null, createdAt: new Date(),
    };
    prisma.notification.create.mockResolvedValue(mockNotification);
    // First call: getPreferences, second call: email lookup
    prisma.user.findUnique
      .mockResolvedValueOnce({ notificationPreferences: { appointment_update: { email: true, push: false } } })
      .mockResolvedValueOnce({ email: 'test@example.com' });

    await service.createAndDispatch('user-1', 'appointment_update', 'Test', 'Body');

    expect(emailService.sendNotificationEmail).toHaveBeenCalledWith('test@example.com', mockNotification);
    expect(pushService.sendToUser).not.toHaveBeenCalled();
  });

  it('sends push when preference is enabled', async () => {
    const mockNotification = {
      id: 'notif-1', userId: 'user-1', type: 'patient_message',
      title: 'Test', body: 'Body', data: { href: '/dashboard/messaging/123' }, readAt: null, createdAt: new Date(),
    };
    prisma.notification.create.mockResolvedValue(mockNotification);
    prisma.user.findUnique.mockResolvedValue({
      notificationPreferences: { patient_message: { email: false, push: true } },
    });

    await service.createAndDispatch('user-1', 'patient_message', 'Test', 'Body', { href: '/dashboard/messaging/123' });

    expect(pushService.sendToUser).toHaveBeenCalledWith('user-1', {
      title: 'Test',
      body: 'Body',
      data: { href: '/dashboard/messaging/123' },
    });
    expect(emailService.sendNotificationEmail).not.toHaveBeenCalled();
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

  it('does not throw when email/push dispatch fails', async () => {
    const mockNotification = {
      id: 'notif-1', userId: 'user-1', type: 'appointment_update',
      title: 'Test', body: 'Body', data: null, readAt: null, createdAt: new Date(),
    };
    prisma.notification.create.mockResolvedValue(mockNotification);
    prisma.user.findUnique.mockRejectedValue(new Error('DB down'));

    // Should not throw
    const result = await service.createAndDispatch('user-1', 'appointment_update', 'Test', 'Body');
    expect(result).toEqual(mockNotification);
  });
});
