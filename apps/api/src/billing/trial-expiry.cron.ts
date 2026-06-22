import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../notifications/email.service';
import { SubscriptionPlan, SubscriptionStatus } from '@psyscale/shared-types';

@Injectable()
export class TrialExpiryCron {
  private readonly logger = new Logger(TrialExpiryCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  /**
   * Runs every day at 03:00 Paris time.
   * Finds Pro trials whose trialEndsAt < now, downgrades to Free, and notifies the user.
   */
  @Cron('0 3 * * *', { timeZone: 'Europe/Paris' })
  async handleExpiredTrials(): Promise<void> {
    const now = new Date();

    const expired = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: { lt: now },
      },
      include: {
        psychologist: { include: { user: true } },
      },
    });

    if (expired.length === 0) return;

    this.logger.log(`Expiring ${expired.length} Pro trial(s)…`);

    for (const sub of expired) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      const userEmail = sub.psychologist?.user?.email;
      const psyName = sub.psychologist?.name ?? 'Psychologue';

      if (userEmail) {
        const billingUrl = 'https://psylib.eu/dashboard/settings/billing';
        const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1E1B4B;max-width:560px;margin:0 auto;padding:24px;">
          <p>Bonjour ${psyName},</p>
          <p>Votre période d'essai <strong>Pro gratuit 6 mois</strong> vient de se terminer. Votre compte est passé au plan <strong>Free</strong>.</p>
          <p>Sur le plan Free, vous conservez :</p>
          <ul>
            <li>Jusqu'à 10 patients</li>
            <li>Les séances et notes illimitées</li>
            <li>L'agenda et la prise de RDV</li>
          </ul>
          <p>Pour retrouver l'IA, la visio, la comptabilité et les fonctionnalités Pro, passez à un plan payant :</p>
          <p><a href="${billingUrl}" style="background:#3D52A0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Choisir mon plan →</a></p>
          <p>Des questions ? Répondez à cet email.</p>
          <p>Cordialement,<br/><strong>Tony</strong><br/>Fondateur PsyLib</p>
        </div>`;
        await this.email.sendRawEmail(userEmail, 'Votre essai Pro PsyLib est terminé', html).catch((err) =>
          this.logger.warn(`Trial expiry email failed for ${userEmail}: ${(err as Error).message}`),
        );
      }

      this.logger.log(`Trial expired → Free: psychologist ${sub.psychologistId}`);
    }
  }
}
