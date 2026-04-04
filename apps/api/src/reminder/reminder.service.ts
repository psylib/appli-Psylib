import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../notifications/email.service';
import { SmsProvider, SMS_PROVIDER } from './sms-provider.interface';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  @Cron('0 */15 * * * *') // Every 15 minutes
  async processReminders(): Promise<void> {
    this.logger.log('Processing appointment reminders...');

    // Find all psychologists with reminders enabled
    const psychologists = await this.prisma.psychologist.findMany({
      where: {
        OR: [
          { reminderEmailEnabled: true },
          { reminderSmsEnabled: true },
        ],
      },
      select: {
        id: true,
        name: true,
        address: true,
        reminderDelay: true,
        reminderEmailEnabled: true,
        reminderSmsEnabled: true,
        reminderTemplate: true,
      },
    });

    let sentCount = 0;

    for (const psy of psychologists) {
      const now = new Date();
      const reminderWindow = new Date(now.getTime() + psy.reminderDelay * 60 * 60 * 1000);

      // Find appointments in the reminder window that haven't been reminded yet
      const appointments = await this.prisma.appointment.findMany({
        where: {
          psychologistId: psy.id,
          status: { in: ['scheduled', 'confirmed'] },
          scheduledAt: { gt: now, lte: reminderWindow },
          reminderSentAt: null,
        },
        include: {
          patient: { select: { name: true, email: true, phone: true } },
          consultationType: { select: { name: true, duration: true } },
        },
      });

      for (const appt of appointments) {
        try {
          const templateVars = {
            patient_name: appt.patient.name,
            psy_name: psy.name,
            date: appt.scheduledAt.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }),
            heure: appt.scheduledAt.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            duree: String(appt.consultationType?.duration ?? appt.duration),
            motif: appt.consultationType?.name ?? 'Consultation',
            adresse: psy.address ?? '',
          };

          if (psy.reminderEmailEnabled && appt.patient.email) {
            const message = this.substituteTemplate(psy.reminderTemplate, templateVars);
            await this.email.sendAppointmentReminder(appt.patient.email, {
              patientName: appt.patient.name,
              psychologistName: psy.name,
              scheduledAt: appt.scheduledAt,
              duration: appt.consultationType?.duration ?? appt.duration,
              motif: templateVars.motif,
              customMessage: psy.reminderTemplate ? message : undefined,
            });
          }

          if (psy.reminderSmsEnabled && appt.patient.phone) {
            const smsMessage = this.substituteTemplate(
              psy.reminderTemplate ??
                'Rappel : RDV avec {psy_name} le {date} a {heure}. {motif} ({duree}min).',
              templateVars,
            );
            await this.sms.sendSms(appt.patient.phone, smsMessage);
          }

          // Mark reminder as sent
          await this.prisma.appointment.update({
            where: { id: appt.id },
            data: { reminderSentAt: new Date() },
          });
          sentCount++;
        } catch (err) {
          this.logger.error(
            `Failed to send reminder for appointment ${appt.id}: ${(err as Error).message}`,
          );
        }
      }
    }

    if (sentCount > 0) {
      this.logger.log(`Sent ${sentCount} reminders`);
    }
  }

  substituteTemplate(template: string | null, vars: Record<string, string>): string {
    if (!template) return '';
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
  }
}
