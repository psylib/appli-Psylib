import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ovh from 'ovh';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OvhClient {
  requestPromised(method: string, path: string, body?: Record<string, unknown>): Promise<unknown>;
}

export interface SmsReminderData {
  patientName: string;
  psychologistName: string;
  scheduledAt: Date;
  duration: number;
  profileUrl?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: OvhClient | null;
  private readonly serviceName: string;
  private readonly sender: string;

  constructor(private readonly config: ConfigService) {
    const appKey = this.config.get<string>('OVH_SMS_APP_KEY');
    const appSecret = this.config.get<string>('OVH_SMS_APP_SECRET');
    const consumerKey = this.config.get<string>('OVH_SMS_CONSUMER_KEY');

    this.serviceName = this.config.get<string>('OVH_SMS_SERVICE_NAME') ?? '';
    this.sender = this.config.get<string>('OVH_SMS_SENDER') ?? 'PsyLib';

    if (appKey && appSecret && consumerKey) {
      this.client = ovh({
        endpoint: 'ovh-eu',
        appKey,
        appSecret,
        consumerKey,
      }) as OvhClient;
    } else {
      this.client = null;
      this.logger.warn('[SmsService] OVH SMS credentials missing — SMS disabled');
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  async sendAppointmentReminder(phone: string, data: SmsReminderData): Promise<void> {
    if (!this.client) return;

    const formatted = this.formatFrenchPhone(phone);
    if (!formatted) {
      this.logger.warn(`[SmsService] Invalid phone number: ${phone}`);
      return;
    }

    const message = this.buildReminderMessage(data);

    try {
      await this.client.requestPromised('POST', `/sms/${this.serviceName}/jobs`, {
        message,
        receivers: [formatted],
        sender: this.sender,
        noStopClause: true,
        charset: 'UTF-8',
      });
      this.logger.log(`[SmsService] SMS rappel envoyé → ${formatted}`);
    } catch (err) {
      this.logger.error(`[SmsService] Échec envoi SMS → ${formatted}: ${(err as Error).message}`);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  buildReminderMessage(data: SmsReminderData): string {
    const dateFormatted = data.scheduledAt.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    });
    const timeFormatted = data.scheduledAt.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const cancelPart = data.profileUrl
      ? `Modifier : ${data.profileUrl}`
      : 'Pour annuler, contactez votre psychologue.';

    return `Rappel PsyLib : RDV le ${dateFormatted} a ${timeFormatted} avec ${data.psychologistName} (${data.duration}min). ${cancelPart}`;
  }

  formatFrenchPhone(phone: string): string | null {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Already international format: 33XXXXXXXXX
    if (digits.startsWith('33') && digits.length === 11) {
      return `+${digits}`;
    }

    // French local: 0XXXXXXXXX → +33XXXXXXXXX
    if (digits.startsWith('0') && digits.length === 10) {
      return `+33${digits.slice(1)}`;
    }

    // Already has +33 in original string
    if (phone.startsWith('+33') && digits.length === 11) {
      return `+${digits}`;
    }

    return null;
  }
}
