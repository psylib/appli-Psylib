import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { EmailService } from '../notifications/email.service';

const NOTIFY_THROTTLE_MS = 6 * 60 * 60 * 1000; // 6h anti-spam

@Injectable()
export class EarlierSlotService {
  private readonly logger = new Logger(EarlierSlotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Un créneau `freedAt` vient de se libérer chez `psychologistId`.
   * Prévient par email les patients dont le RDV est POSTÉRIEUR à ce créneau
   * et qui ont opté pour l'alerte « place plus tôt ».
   */
  async notifyFreedSlot(psychologistId: string, freedAt: Date): Promise<void> {
    const now = new Date();
    if (freedAt.getTime() <= now.getTime()) return; // créneau passé

    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      select: { id: true, name: true, earlierSlotEnabled: true },
    });
    if (!psy || !psy.earlierSlotEnabled) return;

    const throttleBefore = new Date(now.getTime() - NOTIFY_THROTTLE_MS);

    const eligible = await this.prisma.appointment.findMany({
      where: {
        psychologistId,
        status: { in: ['scheduled', 'confirmed'] },
        notifyEarlierSlot: true,
        scheduledAt: { gt: freedAt },
        earlierSlotToken: { not: null },
        OR: [{ earlierSlotNotifiedAt: null }, { earlierSlotNotifiedAt: { lt: throttleBefore } }],
      },
      select: { id: true, patientId: true, scheduledAt: true, duration: true, earlierSlotToken: true },
    });
    if (eligible.length === 0) return;

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';

    for (const appt of eligible) {
      try {
        const windowEnd = new Date(freedAt.getTime() + appt.duration * 60000);
        const free = await this.availability.getAvailableTimeslots(
          psychologistId,
          freedAt,
          windowEnd,
          appt.duration,
        );
        const fits = free.some((d) => d.getTime() === freedAt.getTime());
        if (!fits) continue;

        if (!appt.patientId) continue;
        const patient = await this.prisma.patient.findUnique({
          where: { id: appt.patientId },
          select: { name: true, email: true },
        });
        if (!patient?.email) continue;

        await this.email.sendEarlierSlotAvailable(patient.email, {
          patientName: patient.name,
          psychologistName: psy.name,
          currentDate: appt.scheduledAt,
          claimUrl: `${frontendUrl}/rebook/${appt.earlierSlotToken}`,
          unsubscribeUrl: `${frontendUrl}/api/v1/public/rebook/${appt.earlierSlotToken}/unsubscribe`,
        });

        await this.prisma.appointment.update({
          where: { id: appt.id },
          data: { earlierSlotNotifiedAt: new Date() },
        });
      } catch (err) {
        this.logger.warn(
          `notifyFreedSlot: échec pour RDV ${appt.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
