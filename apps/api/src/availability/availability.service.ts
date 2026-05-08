import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SaveAvailabilityDto } from './dto/availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getSlots(userId: string) {
    const psy = await this.getPsychologist(userId);
    return this.prisma.availability.findMany({
      where: { psychologistId: psy.id },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async saveSlots(userId: string, dto: SaveAvailabilityDto) {
    const psy = await this.getPsychologist(userId);

    // Remplace tous les créneaux par les nouveaux (deleteMany + createMany)
    await this.prisma.availability.deleteMany({ where: { psychologistId: psy.id } });

    if (dto.slots.length > 0) {
      await this.prisma.availability.createMany({
        data: dto.slots.map((s) => ({
          psychologistId: psy.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isActive: s.isActive ?? true,
        })),
      });
    }

    return this.prisma.availability.findMany({
      where: { psychologistId: psy.id },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async deleteSlot(userId: string, slotId: string) {
    const psy = await this.getPsychologist(userId);
    await this.prisma.availability.deleteMany({
      where: { id: slotId, psychologistId: psy.id },
    });
    return { success: true };
  }

  async updateSlot(
    userId: string,
    slotId: string,
    data: { startTime?: string; endTime?: string; isActive?: boolean },
  ) {
    const psy = await this.getPsychologist(userId);

    const slot = await this.prisma.availability.findFirst({
      where: { id: slotId, psychologistId: psy.id },
    });
    if (!slot) throw new NotFoundException('Créneau introuvable');

    return this.prisma.availability.update({
      where: { id: slotId },
      data,
    });
  }

  /**
   * Génère les créneaux disponibles sur une période (max 30 jours).
   * Exclut les RDV existants.
   */
  async getAvailableTimeslots(
    psychologistId: string,
    from: Date,
    to: Date,
    sessionDuration: number = 50,
  ): Promise<Date[]> {
    const slots = await this.prisma.availability.findMany({
      where: { psychologistId, isActive: true },
    });

    if (slots.length === 0) return [];

    // Récupère le minBreakMinutes du psychologue (pause minimale entre RDV)
    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      select: { minBreakMinutes: true },
    });
    const minBreak = psy?.minBreakMinutes ?? 0;

    // Récupère les RDV existants sur la période
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        psychologistId,
        scheduledAt: { gte: from, lte: to },
        status: { not: 'cancelled' },
      },
      select: { scheduledAt: true, duration: true },
    });

    // Fetch external calendar events that overlap with the requested range
    const externalEvents = await this.prisma.externalCalendarEvent.findMany({
      where: {
        psychologistId,
        status: { not: 'cancelled' },
        OR: [
          { startAt: { lt: to }, endAt: { gt: from } },
          { isAllDay: true, startAt: { gte: from, lt: to } },
        ],
      },
      select: { startAt: true, endAt: true, isAllDay: true },
    });

    const freeTimes: Date[] = [];
    const current = new Date(from);
    current.setHours(0, 0, 0, 0);

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    while (current <= endDate) {
      // dayOfWeek: 0=Lundi ... 6=Dimanche (notre convention)
      const jsDay = current.getDay(); // 0=Dimanche, 1=Lundi...
      const ourDay = jsDay === 0 ? 6 : jsDay - 1;

      const daySlot = slots.find((s) => s.dayOfWeek === ourDay);
      if (daySlot) {
        // Check if this day is blocked by an all-day external event
        const dayStart = new Date(current);
        const dayEnd = new Date(current);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const isBlockedByAllDay = externalEvents.some(
          (e) => e.isAllDay && e.startAt < dayEnd && e.endAt > dayStart,
        );
        if (isBlockedByAllDay) {
          current.setDate(current.getDate() + 1);
          continue;
        }

        const [startH, startM] = daySlot.startTime.split(':').map((x: string) => Number(x));
        const [endH, endM] = daySlot.endTime.split(':').map((x: string) => Number(x));

        const slotStart = new Date(current);
        slotStart.setHours(startH ?? 9, startM ?? 0, 0, 0);
        const slotEnd = new Date(current);
        slotEnd.setHours(endH ?? 18, endM ?? 0, 0, 0);

        const cursor = new Date(slotStart);
        while (cursor.getTime() + sessionDuration * 60000 <= slotEnd.getTime()) {
          const slotTime = new Date(cursor);
          // Vérifie qu'aucun RDV n'est à ce moment (avec buffer de pause si configuré)
          const hasConflict = existingAppointments.some((appt) => {
            const apptStart = new Date(appt.scheduledAt).getTime();
            const apptEnd = apptStart + appt.duration * 60000;
            // Étend la fenêtre occupée par la pause minimale entre RDV
            const occupiedEnd = minBreak > 0 ? apptEnd + minBreak * 60000 : apptEnd;
            const newStart = slotTime.getTime();
            const newEnd = newStart + sessionDuration * 60000;
            return newStart < occupiedEnd && newEnd > apptStart;
          });

          // Also block slots that overlap with external calendar events
          const breakBuffer = minBreak * 60000;
          const hasExternalConflict = externalEvents.some((e) => {
            if (e.isAllDay) return false; // Already handled above
            const eStart = e.startAt.getTime() - breakBuffer;
            const eEnd = e.endAt.getTime() + breakBuffer;
            const newStart = slotTime.getTime();
            const newEnd = newStart + sessionDuration * 60000;
            return newStart < eEnd && newEnd > eStart;
          });

          if (!hasConflict && !hasExternalConflict && slotTime > new Date()) {
            freeTimes.push(slotTime);
          }

          cursor.setMinutes(cursor.getMinutes() + sessionDuration);
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return freeTimes;
  }

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }
}
