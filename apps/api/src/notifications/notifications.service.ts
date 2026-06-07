import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { EmailService } from './email.service';
import { PushService } from './push.service';

/** Types de notification dont les préférences sont persistables (allow-list). */
const NOTIFICATION_PREFERENCE_TYPES = [
  'session_reminder',
  'patient_message',
  'mood_alert',
  'ai_complete',
  'payment',
  'appointment_update',
  'session_update',
  'patient_update',
] as const;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
  ) {}

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification introuvable');
    if (notification.userId !== userId) throw new ForbiddenException();

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: true };
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification introuvable');
    if (notification.userId !== userId) throw new ForbiddenException();

    await this.prisma.notification.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Notification Preferences ─────────────────────────────────────────────

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });
    return user?.notificationPreferences ?? this.defaultPreferences();
  }

  async savePreferences(userId: string, preferences: Record<string, { email: boolean; push: boolean }>) {
    const sanitized = this.sanitizePreferences(preferences);
    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: sanitized },
    });
    return { success: true };
  }

  /**
   * Borne les préférences aux types connus + coerce email/push en booléens.
   * Le body de PUT /preferences a des clés dynamiques (types de notif) que le
   * ValidationPipe global (whitelist) ne peut pas valider via DTO sans les stripper.
   */
  private sanitizePreferences(
    input: unknown,
  ): Record<string, { email: boolean; push: boolean }> {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestException('Préférences invalides');
    }
    const source = input as Record<string, unknown>;
    const result: Record<string, { email: boolean; push: boolean }> = {};
    for (const type of NOTIFICATION_PREFERENCE_TYPES) {
      // hasOwnProperty pour ignorer __proto__ / clés héritées
      if (!Object.prototype.hasOwnProperty.call(source, type)) continue;
      const value = source[type];
      if (value === null || typeof value !== 'object') continue;
      const v = value as Record<string, unknown>;
      result[type] = { email: v.email === true, push: v.push === true };
    }
    return result;
  }

  private defaultPreferences() {
    return {
      session_reminder: { email: true, push: true },
      patient_message: { email: true, push: true },
      mood_alert: { email: true, push: true },
      ai_complete: { email: false, push: true },
      payment: { email: true, push: false },
      appointment_update: { email: true, push: true },
      session_update: { email: false, push: false },
      patient_update: { email: true, push: true },
    };
  }

  /**
   * Create notification in DB + dispatch via WebSocket, email, push.
   * All channel dispatches are fire-and-forget — failures never block the caller.
   */
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
    this.gateway.sendToUser(userId, notification as unknown as Record<string, unknown>);

    // 3. Check preferences and dispatch to other channels (fire-and-forget, error-isolated)
    try {
      const prefs = await this.getPreferences(userId) as Record<string, { email: boolean; push: boolean }>;
      const typePrefs = prefs[type] ?? { email: true, push: true };

      if (typePrefs.email) {
        // Look up user email for the email service (which has no Prisma access)
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        if (user?.email) {
          void this.emailService.sendNotificationEmail(user.email, notification).catch(() => {});
        }
      }

      if (typePrefs.push) {
        const pushData = data
          ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
          : undefined;
        void this.pushService.sendToUser(userId, { title, body, data: pushData }).catch(() => {});
      }
    } catch {
      // Non-blocking — preference/dispatch failures must never affect the caller
    }

    return notification;
  }

  async createNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
