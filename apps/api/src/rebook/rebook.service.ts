import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { EmailService } from '../notifications/email.service';
import { AuditService } from '../common/audit.service';

@Injectable()
export class RebookService {
  private readonly logger = new Logger(RebookService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly audit: AuditService,
  ) {
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
  }

  private async loadByToken(token: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { earlierSlotToken: token },
      include: { psychologist: { select: { id: true, name: true, slug: true } } },
    });
    if (!appt) throw new NotFoundException('Lien invalide ou expiré');
    return appt;
  }

  async getByToken(token: string) {
    const appt = await this.loadByToken(token);
    return {
      psychologistName: appt.psychologist.name,
      currentDate: appt.scheduledAt.toISOString(),
      duration: appt.duration,
      active: appt.status === 'scheduled' || appt.status === 'confirmed',
      notifyEarlierSlot: appt.notifyEarlierSlot,
    };
  }

  async listEarlierSlots(token: string) {
    const appt = await this.loadByToken(token);
    const now = new Date();
    const to = appt.scheduledAt;
    let slots: string[] = [];
    if (to.getTime() > now.getTime() && (appt.status === 'scheduled' || appt.status === 'confirmed')) {
      const free = await this.availability.getAvailableTimeslots(appt.psychologistId, now, to, appt.duration);
      slots = free.filter((d) => d.getTime() < to.getTime()).map((d) => d.toISOString());
    }
    return {
      psychologistName: appt.psychologist.name,
      currentDate: appt.scheduledAt.toISOString(),
      slots,
    };
  }

  async moveToSlot(token: string, newSlotIso: string) {
    const appt = await this.loadByToken(token);
    if (appt.status !== 'scheduled' && appt.status !== 'confirmed') {
      throw new BadRequestException('Ce rendez-vous ne peut plus être déplacé');
    }
    const newSlot = new Date(newSlotIso);
    if (isNaN(newSlot.getTime())) throw new BadRequestException('Créneau invalide');
    if (newSlot.getTime() >= appt.scheduledAt.getTime()) {
      throw new BadRequestException("Ce créneau n'est pas plus tôt que votre rendez-vous actuel");
    }
    if (newSlot.getTime() <= Date.now()) throw new BadRequestException('Ce créneau est déjà passé');

    const oldDate = appt.scheduledAt;
    const duration = appt.duration;

    await this.prisma.$transaction(
      async (tx) => {
        // FIX I-2: Re-read status inside the transaction to guard against a concurrent cancellation
        const fresh = await tx.appointment.findUnique({
          where: { id: appt.id },
          select: { status: true },
        });
        if (!fresh || (fresh.status !== 'scheduled' && fresh.status !== 'confirmed')) {
          throw new ConflictException('Ce rendez-vous a été annulé entre-temps');
        }

        const newEnd = new Date(newSlot.getTime() + duration * 60000);
        const windowStart = new Date(newSlot.getTime() - 24 * 60 * 60000);
        const candidates = await tx.appointment.findMany({
          where: {
            psychologistId: appt.psychologistId,
            id: { not: appt.id },
            status: { not: 'cancelled' },
            bookingPaymentStatus: { not: 'payment_failed' },
            scheduledAt: { gte: windowStart, lt: newEnd },
          },
          select: { scheduledAt: true, duration: true },
        });
        const overlap = candidates.some((c) => {
          const cEnd = new Date(new Date(c.scheduledAt).getTime() + c.duration * 60000);
          return cEnd > newSlot;
        });
        if (overlap) throw new ConflictException('Ce créneau vient d\'être pris');

        await tx.appointment.update({
          where: { id: appt.id },
          data: { scheduledAt: newSlot, earlierSlotNotifiedAt: null },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // Émis APRÈS commit de la transaction : si la tx échoue (sérialisation/conflit),
    // l'await ci-dessus rejette et on n'atteint jamais cette ligne.
    // L'ancienne heure se libère → cascade vers d'autres patients en attente.
    this.eventEmitter.emit('slot.freed', { psychologistId: appt.psychologistId, freedAt: oldDate });

    if (appt.patientId) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: appt.patientId },
        select: { name: true, email: true },
      });
      if (patient?.email) {
        void this.email
          .sendBookingReceivedToPatient(patient.email, {
            patientName: patient.name,
            psychologistName: appt.psychologist.name,
            scheduledAt: newSlot,
            duration,
            cancelUrl: appt.cancelToken
              ? `${this.frontendUrl}/appointments/cancel/${appt.cancelToken}`
              : `${this.frontendUrl}/psy/${appt.psychologist.slug}`,
          })
          .catch((err) => this.logger.warn(`rebook confirmation email failed: ${(err as Error).message}`));
      }
    }

    // Audit log — HDS compliance, mirroring cancelByToken audit shape
    await this.audit.log({
      actorId: appt.patientId ?? appt.psychologistId,
      actorType: 'patient',
      action: 'UPDATE',
      entityType: 'appointment',
      entityId: appt.id,
      metadata: {
        action: 'earlier_slot_move',
        from: oldDate.toISOString(),
        to: newSlot.toISOString(),
      },
    });

    return { success: true, scheduledAt: newSlot.toISOString() };
  }

  async unsubscribe(token: string) {
    const appt = await this.prisma.appointment.findFirst({ where: { earlierSlotToken: token } });
    if (!appt) throw new NotFoundException('Lien invalide');
    await this.prisma.appointment.update({
      where: { id: appt.id },
      data: { notifyEarlierSlot: false },
    });
    return { success: true };
  }
}
