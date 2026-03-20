import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { ConfigService } from '@nestjs/config';

const SEQUENCE_ACTIONS = {
  day1: 'EMAIL_SEQUENCE_DAY_1',
  day3: 'EMAIL_SEQUENCE_DAY_3',
  day7: 'EMAIL_SEQUENCE_DAY_7',
  reEngagement: 'RE_ENGAGEMENT_EMAIL',
} as const;

@Injectable()
export class EmailSequenceService {
  private readonly logger = new Logger(EmailSequenceService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly sms: SmsService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
  }

  // ─── Rappels RDV J-1 — tourne à 8h00 chaque jour ────────────────────────────

  @Cron('0 8 * * *', { timeZone: 'Europe/Paris' })
  async runAppointmentReminders(): Promise<void> {
    this.logger.log('[Reminders] Démarrage rappels RDV J-1');

    const now = new Date();
    const windowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000); // +20h
    const windowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000);   // +28h

    const appointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: windowStart, lte: windowEnd },
        status: { in: ['scheduled', 'confirmed'] },
        OR: [
          { reminderSentAt: null },
          { smsReminderSentAt: null },
        ],
      },
      include: {
        patient: { select: { name: true, email: true, phone: true } },
        psychologist: { select: { name: true, slug: true } },
      },
    });

    this.logger.log(`[Reminders] ${appointments.length} RDV à rappeler`);

    for (const appt of appointments) {
      const reminderData = {
        patientName: appt.patient.name,
        psychologistName: appt.psychologist.name,
        scheduledAt: appt.scheduledAt,
        duration: appt.duration,
      };

      // Email reminder
      if (appt.patient.email && !appt.reminderSentAt) {
        try {
          await this.email.sendAppointmentReminder(appt.patient.email, reminderData);
          await this.prisma.appointment.update({
            where: { id: appt.id },
            data: { reminderSentAt: new Date() },
          });
          this.logger.log(`[Reminders] Email envoyé → ${appt.patient.email} (RDV ${appt.id})`);
        } catch (err) {
          this.logger.error(`[Reminders] Échec email ${appt.id}: ${(err as Error).message}`);
        }
      }

      // SMS reminder
      if (appt.patient.phone && !appt.smsReminderSentAt) {
        try {
          const profileUrl = appt.psychologist.slug
            ? `${this.frontendUrl}/psy/${appt.psychologist.slug}`
            : undefined;
          await this.sms.sendAppointmentReminder(appt.patient.phone, { ...reminderData, profileUrl });
          await this.prisma.appointment.update({
            where: { id: appt.id },
            data: { smsReminderSentAt: new Date() },
          });
          this.logger.log(`[Reminders] SMS envoyé → ${appt.patient.phone} (RDV ${appt.id})`);
        } catch (err) {
          this.logger.error(`[Reminders] Échec SMS ${appt.id}: ${(err as Error).message}`);
        }
      }
    }
  }

  // ─── Séquence activation Day 1/3/7 — tourne à 9h00 chaque jour ──────────────

  @Cron('0 9 * * *', { timeZone: 'Europe/Paris' })
  async runDailySequence(): Promise<void> {
    this.logger.log('[EmailSequence] Démarrage séquence activation quotidienne');

    const now = new Date();

    await Promise.all([
      this.processWindow(now, 1, SEQUENCE_ACTIONS.day1),
      this.processWindow(now, 3, SEQUENCE_ACTIONS.day3),
      this.processWindow(now, 7, SEQUENCE_ACTIONS.day7),
    ]);
  }

  private async processWindow(
    now: Date,
    daysAgo: number,
    action: string,
  ): Promise<void> {
    const windowStart = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - 30 * 60 * 1000);
    const windowEnd = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 + 30 * 60 * 1000);

    // Psys créées dans la fenêtre de ±30min autour de J-N
    const psys = await this.prisma.psychologist.findMany({
      where: { user: { createdAt: { gte: windowStart, lte: windowEnd } } },
      include: { user: true, subscription: true },
    });

    if (psys.length === 0) return;
    this.logger.log(`[EmailSequence] ${action}: ${psys.length} psy(s) dans la fenêtre`);

    for (const psy of psys) {
      await this.sendIfNotAlreadySent(psy, action);
    }
  }

  private async sendIfNotAlreadySent(
    psy: { id: string; name: string; slug: string | null; user: { id: string; email: string; createdAt: Date }; subscription: { status: string; trialEndsAt: Date | null } | null },
    action: string,
  ): Promise<void> {
    // Vérifier si déjà envoyé via audit_logs
    const alreadySent = await this.prisma.auditLog.findFirst({
      where: { actorId: psy.user.id, action, entityType: 'email_sequence', entityId: psy.id },
    });
    if (alreadySent) return;

    try {
      await this.sendEmail(psy, action);

      // Logguer l'envoi
      await this.prisma.auditLog.create({
        data: {
          actorId: psy.user.id,
          actorType: 'system',
          action,
          entityType: 'email_sequence',
          entityId: psy.id,
          ipAddress: '0.0.0.0',
        },
      });

      this.logger.log(`[EmailSequence] ${action} envoyé → ${psy.user.email}`);
    } catch (err) {
      this.logger.error(`[EmailSequence] Échec ${action} pour ${psy.user.email}: ${(err as Error).message}`);
    }
  }

  // ─── Re-engagement hebdomadaire — lundi 10h00 ────────────────────────────────

  @Cron('0 10 * * 1', { timeZone: 'Europe/Paris' })
  async runReEngagement(): Promise<void> {
    this.logger.log('[ReEngagement] Démarrage cron re-engagement hebdomadaire');

    const now = new Date();
    const cutoff14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Psys actives (trialing ou active) inscrites depuis > 14 jours
    // include sessions (take:1) pour éviter le N+1 "lastSession"
    const candidates = await this.prisma.psychologist.findMany({
      where: {
        user: { createdAt: { lte: cutoff14d } },
        subscription: { status: { in: ['trialing', 'active'] } },
      },
      include: {
        user: { select: { id: true, email: true, createdAt: true } },
        subscription: { select: { status: true } },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    this.logger.log(`[ReEngagement] ${candidates.length} candidats à analyser`);

    // Prefetch des audit logs en 1 requête — évite le N+1 "alreadySent"
    const recentAuditLogs = await this.prisma.auditLog.findMany({
      where: {
        actorId: { in: candidates.map(c => c.user.id) },
        action: SEQUENCE_ACTIONS.reEngagement,
        entityType: 're_engagement',
        createdAt: { gte: cutoff30d },
      },
      select: { entityId: true },
    });
    const alreadySentSet = new Set(recentAuditLogs.map(l => l.entityId));

    for (const psy of candidates) {
      try {
        // Dernière séance depuis le include (pas de requête supplémentaire)
        const lastSession = psy.sessions[0] ?? null;

        // Ignorer si session récente (< 14 jours)
        if (lastSession && lastSession.createdAt > cutoff14d) continue;

        // Dedup via Set (lookup O(1) — pas de requête DB)
        if (alreadySentSet.has(psy.id)) continue;

        // Calculer le nb de jours depuis la dernière séance (ou depuis l'inscription si aucune)
        const lastActivity = lastSession?.createdAt ?? psy.user.createdAt;
        const daysSinceLastSession = Math.floor(
          (now.getTime() - (lastActivity instanceof Date ? lastActivity.getTime() : now.getTime())) / 86400000,
        );

        await this.email.sendReEngagement(psy.user.email, {
          psychologistName: psy.name,
          daysSinceLastSession: Math.max(14, daysSinceLastSession),
          dashboardUrl: this.frontendUrl + '/dashboard',
        });

        await this.prisma.auditLog.create({
          data: {
            actorId: psy.user.id,
            actorType: 'system',
            action: SEQUENCE_ACTIONS.reEngagement,
            entityType: 're_engagement',
            entityId: psy.id,
            ipAddress: '0.0.0.0',
          },
        });

        this.logger.log(`[ReEngagement] Email envoyé → ${psy.user.email} (${daysSinceLastSession}j sans séance)`);
      } catch (err) {
        this.logger.error(`[ReEngagement] Échec pour ${psy.user.email}: ${(err as Error).message}`);
      }
    }
  }

  private async sendEmail(
    psy: { name: string; slug: string | null; user: { email: string; createdAt: Date }; subscription: { status: string; trialEndsAt: Date | null } | null },
    action: string,
  ): Promise<void> {
    const dashboardUrl = `${this.frontendUrl}/dashboard`;
    const profileUrl = psy.slug
      ? `${this.frontendUrl}/psy/${psy.slug}`
      : `${this.frontendUrl}/dashboard/settings/profile`;

    if (action === SEQUENCE_ACTIONS.day1) {
      await this.email.sendActivationDay1(psy.user.email, {
        psychologistName: psy.name,
        dashboardUrl,
      });
    } else if (action === SEQUENCE_ACTIONS.day3) {
      await this.email.sendActivationDay3(psy.user.email, {
        psychologistName: psy.name,
        dashboardUrl,
        profileUrl,
      });
    } else if (action === SEQUENCE_ACTIONS.day7) {
      const trialEndsAt = psy.subscription?.trialEndsAt;
      const daysLeft = trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000))
        : 14;
      await this.email.sendActivationDay7(psy.user.email, {
        psychologistName: psy.name,
        dashboardUrl,
        daysLeft,
      });
    }
  }
}
