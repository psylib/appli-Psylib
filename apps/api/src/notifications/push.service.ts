/**
 * Push Notification Service — Expo Server SDK
 * HDS: NEVER include patient names in push payloads (visible on lock screen).
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  badge?: number;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error: string };
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send push notification to a user by their ID.
   * Returns true if sent successfully.
   */
  async sendToUser(
    userId: string,
    notification: { title: string; body: string; data?: Record<string, string> },
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });

    if (!user?.pushToken) {
      this.logger.debug(`No push token for user ${userId}`);
      return false;
    }

    return this.sendPush({
      to: user.pushToken,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: 'default',
    });
  }

  /**
   * Send push notification via Expo Push Service.
   */
  private async sendPush(message: ExpoPushMessage): Promise<boolean> {
    try {
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        this.logger.error(`Expo push API returned ${response.status}`);
        return false;
      }

      const result = (await response.json()) as { data: ExpoPushTicket };
      if (result.data.status === 'error') {
        this.logger.error(`Push error: ${result.data.message}`);

        // Clear invalid tokens
        if (result.data.details?.error === 'DeviceNotRegistered') {
          await this.clearPushToken(message.to);
        }

        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Push notification failed: ${error}`);
      return false;
    }
  }

  /**
   * Register a push token for a user.
   */
  async registerToken(userId: string, pushToken: string, pushPlatform: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushToken, pushPlatform },
    });
    this.logger.log(`Push token registered for user ${userId} (${pushPlatform})`);
  }

  /**
   * Clear a push token (invalid or unregistered device).
   */
  private async clearPushToken(pushToken: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { pushToken },
      data: { pushToken: null, pushPlatform: null },
    });
    this.logger.warn(`Cleared invalid push token: ${pushToken.substring(0, 20)}...`);
  }
}
