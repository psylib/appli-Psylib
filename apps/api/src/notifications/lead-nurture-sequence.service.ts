import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';

/**
 * Lead nurturing sequence — 5 emails over 10 days for /beta signups.
 *
 * Uses `audit_logs` for both tracking lead signups and dedup of sent emails.
 * - Lead signup is logged as action: 'LEAD_SIGNUP_BETA' with entityType: 'lead'
 *   and metadata: { email, name }
 * - Each nurture email sent is logged as action: 'NURTURE_*' with entityType: 'lead_nurture'
 *
 * Schedule:
 *   J+0  → sendNurtureWelcome   (sent immediately on signup, not by cron)
 *   J+2  → sendNurtureProblem
 *   J+4  → sendNurtureProof
 *   J+7  → sendNurtureDemo
 *   J+10 → sendNurtureOffer
 */

const NURTURE_ACTIONS = {
  welcome: 'NURTURE_WELCOME',
  problem: 'NURTURE_PROBLEM',
  proof: 'NURTURE_PROOF',
  demo: 'NURTURE_DEMO',
  offer: 'NURTURE_OFFER',
} as const;

const NURTURE_SCHEDULE: {
  daysAfterSignup: number;
  action: string;
  method: 'sendNurtureProblem' | 'sendNurtureProof' | 'sendNurtureDemo' | 'sendNurtureOffer';
}[] = [
  { daysAfterSignup: 2, action: NURTURE_ACTIONS.problem, method: 'sendNurtureProblem' },
  { daysAfterSignup: 4, action: NURTURE_ACTIONS.proof, method: 'sendNurtureProof' },
  { daysAfterSignup: 7, action: NURTURE_ACTIONS.demo, method: 'sendNurtureDemo' },
  { daysAfterSignup: 10, action: NURTURE_ACTIONS.offer, method: 'sendNurtureOffer' },
];

/** Number of founder spots remaining (updated manually or from DB). */
const FOUNDER_SPOTS_LEFT = 13;

@Injectable()
export class LeadNurtureSequenceService {
  private readonly logger = new Logger(LeadNurtureSequenceService.name);
  private readonly betaUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {
    this.betaUrl = (this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu') + '/beta';
  }

  // ─── Cron: runs daily at 10h30 ────────────────────────────────────────────────

  @Cron('30 10 * * *', { timeZone: 'Europe/Paris' })
  async runLeadNurtureSequence(): Promise<void> {
    this.logger.log('[LeadNurture] Démarrage séquence nurturing leads');

    const now = new Date();

    // 1. Fetch all lead signups from audit_logs
    const leadSignups = await this.prisma.auditLog.findMany({
      where: {
        action: 'LEAD_SIGNUP_BETA',
        entityType: 'lead',
      },
      select: {
        id: true,
        entityId: true,
        metadata: true,
        createdAt: true,
      },
    });

    if (leadSignups.length === 0) return;

    this.logger.log(`[LeadNurture] ${leadSignups.length} leads à analyser`);

    // 2. Prefetch all nurture emails already sent — avoids N+1
    const entityIds = leadSignups.map((l) => l.entityId);
    const sentAuditLogs = await this.prisma.auditLog.findMany({
      where: {
        action: { startsWith: 'NURTURE_' },
        entityType: 'lead_nurture',
        entityId: { in: entityIds },
      },
      select: { entityId: true, action: true },
    });
    const sentSet = new Set(sentAuditLogs.map((l) => `${l.entityId}:${l.action}`));

    // 3. Process each lead
    for (const lead of leadSignups) {
      const meta = lead.metadata as Record<string, unknown> | null;
      const email = typeof meta?.email === 'string' ? meta.email : null;
      const name = typeof meta?.name === 'string' ? meta.name : 'Bonjour';

      if (!email) continue;

      const daysSinceSignup = Math.floor(
        (now.getTime() - lead.createdAt.getTime()) / 86400000,
      );

      for (const step of NURTURE_SCHEDULE) {
        if (daysSinceSignup < step.daysAfterSignup) continue;
        // Only send on the exact day (±1 day window to handle cron timing)
        if (daysSinceSignup > step.daysAfterSignup + 1) continue;

        const key = `${lead.entityId}:${step.action}`;
        if (sentSet.has(key)) continue;

        try {
          const data = { name, betaUrl: this.betaUrl };

          if (step.method === 'sendNurtureOffer') {
            await this.email.sendNurtureOffer(email, { ...data, spotsLeft: FOUNDER_SPOTS_LEFT });
          } else {
            await this.email[step.method](email, data);
          }

          // Log sent email for dedup
          await this.prisma.auditLog.create({
            data: {
              actorId: lead.entityId, // lead ID
              actorType: 'system',
              action: step.action,
              entityType: 'lead_nurture',
              entityId: lead.entityId,
              ipAddress: '0.0.0.0',
              metadata: { email, name, daysSinceSignup },
            },
          });

          sentSet.add(key);
          this.logger.log(
            `[LeadNurture] ${step.action} envoyé → ${email} (J+${daysSinceSignup})`,
          );
        } catch (err) {
          this.logger.error(
            `[LeadNurture] Échec ${step.action} pour ${email}: ${(err as Error).message}`,
          );
        }
      }
    }
  }

  // ─── Public: log a new lead signup + send welcome email ───────────────────────

  async registerLeadAndSendWelcome(data: {
    email: string;
    name: string;
    adeli?: string;
    message?: string;
    ipAddress?: string;
  }): Promise<void> {
    const leadId = crypto.randomUUID();

    // Log the signup
    await this.prisma.auditLog.create({
      data: {
        actorId: leadId,
        actorType: 'system',
        action: 'LEAD_SIGNUP_BETA',
        entityType: 'lead',
        entityId: leadId,
        ipAddress: data.ipAddress ?? '0.0.0.0',
        metadata: {
          email: data.email,
          name: data.name,
          adeli: data.adeli ?? null,
          message: data.message ?? null,
        },
      },
    });

    // Send welcome email immediately
    await this.email.sendNurtureWelcome(data.email, {
      name: data.name,
      betaUrl: (this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu') + '/beta',
    });

    // Log welcome as sent
    await this.prisma.auditLog.create({
      data: {
        actorId: leadId,
        actorType: 'system',
        action: NURTURE_ACTIONS.welcome,
        entityType: 'lead_nurture',
        entityId: leadId,
        ipAddress: '0.0.0.0',
        metadata: { email: data.email, name: data.name },
      },
    });

    this.logger.log(`[LeadNurture] Lead enregistré + welcome envoyé → ${data.email}`);
  }
}
