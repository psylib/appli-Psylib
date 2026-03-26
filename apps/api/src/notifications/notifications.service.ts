import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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
    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: preferences },
    });
    return { success: true };
  }

  private defaultPreferences() {
    return {
      session_reminder: { email: true, push: true },
      patient_message: { email: true, push: true },
      mood_alert: { email: true, push: true },
      ai_complete: { email: false, push: true },
      payment: { email: true, push: false },
    };
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
