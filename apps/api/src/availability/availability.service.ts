import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
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

    // Vérifier qu'il n'y a pas de chevauchement entre les créneaux du même jour
    this.validateNoOverlap(dto.slots);

    // Transaction pour éviter la perte de données en cas de crash entre delete et create
    await this.prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({ where: { psychologistId: psy.id } });

      if (dto.slots.length > 0) {
        await tx.availability.createMany({
          data: dto.slots.map((s) => ({
            psychologistId: psy.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isActive: s.isActive ?? true,
          })),
        });
      }
    });

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
   * Toutes les heures de disponibilité sont interprétées en Europe/Paris.
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

    // Iterate day-by-day using Paris calendar dates to avoid timezone drift
    const startParis = this.toParisDateParts(from);
    const endParis = this.toParisDateParts(to);

    let dayYear = startParis.year;
    let dayMonth = startParis.month;
    let dayDate = startParis.date;

    // Safety: max 35 days to prevent infinite loop
    for (let safety = 0; safety < 35; safety++) {
      // Check if we've passed the end date
      const dayMidnightUtc = this.parisToUtc(dayYear, dayMonth, dayDate, 0, 0);
      const endMidnightUtc = this.parisToUtc(endParis.year, endParis.month, endParis.date, 23, 59);
      if (dayMidnightUtc > endMidnightUtc) break;

      // dayOfWeek: 0=Lundi ... 6=Dimanche (notre convention)
      const jsDay = dayMidnightUtc.getUTCDay();
      const ourDay = jsDay === 0 ? 6 : jsDay - 1;

      // Tous les créneaux du jour (un psy peut avoir matin + après-midi)
      const daySlots = slots.filter((s) => s.dayOfWeek === ourDay);
      if (daySlots.length > 0) {
        // Check if this day is blocked by an all-day external event
        const dayStartUtc = dayMidnightUtc;
        const dayEndUtc = this.parisToUtc(dayYear, dayMonth, dayDate + 1, 0, 0);
        const isBlockedByAllDay = externalEvents.some(
          (e) => e.isAllDay && e.startAt < dayEndUtc && e.endAt > dayStartUtc,
        );
        if (!isBlockedByAllDay) {
          const breakBuffer = minBreak * 60000;

          for (const daySlot of daySlots) {
            const [rawStartH, rawStartM] = daySlot.startTime.split(':');
            const [rawEndH, rawEndM] = daySlot.endTime.split(':');
            const startH = parseInt(rawStartH ?? '9', 10);
            const startM = parseInt(rawStartM ?? '0', 10);
            const endH = parseInt(rawEndH ?? '18', 10);
            const endM = parseInt(rawEndM ?? '0', 10);

            if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) continue;

            // Create slot boundaries in Paris timezone → UTC
            const slotStartUtc = this.parisToUtc(dayYear, dayMonth, dayDate, startH, startM);
            const slotEndUtc = this.parisToUtc(dayYear, dayMonth, dayDate, endH, endM);

            const cursorMs = slotStartUtc.getTime();
            const slotEndMs = slotEndUtc.getTime();
            let pos = cursorMs;

            while (pos + sessionDuration * 60000 <= slotEndMs) {
              const slotTime = new Date(pos);
              // Vérifie qu'aucun RDV n'est à ce moment (avec buffer de pause symétrique)
              const hasConflict = existingAppointments.some((appt) => {
                const apptStart = new Date(appt.scheduledAt).getTime();
                const apptEnd = apptStart + appt.duration * 60000;
                const occupiedStart = minBreak > 0 ? apptStart - breakBuffer : apptStart;
                const occupiedEnd = minBreak > 0 ? apptEnd + breakBuffer : apptEnd;
                const newStart = pos;
                const newEnd = newStart + sessionDuration * 60000;
                return newStart < occupiedEnd && newEnd > occupiedStart;
              });

              // Also block slots that overlap with external calendar events
              const hasExternalConflict = externalEvents.some((e) => {
                if (e.isAllDay) return false;
                const eStart = e.startAt.getTime() - breakBuffer;
                const eEnd = e.endAt.getTime() + breakBuffer;
                const newStart = pos;
                const newEnd = newStart + sessionDuration * 60000;
                return newStart < eEnd && newEnd > eStart;
              });

              if (!hasConflict && !hasExternalConflict && slotTime > new Date()) {
                freeTimes.push(slotTime);
              }

              pos += (sessionDuration + minBreak) * 60000;
            }
          }
        }
      }

      // Advance to next day
      const nextDay = new Date(Date.UTC(dayYear, dayMonth, dayDate + 1));
      dayYear = nextDay.getUTCFullYear();
      dayMonth = nextDay.getUTCMonth();
      dayDate = nextDay.getUTCDate();
    }

    return freeTimes;
  }

  /**
   * Convert a date/time in Europe/Paris to a UTC Date.
   * Availability HH:MM are always in Paris timezone.
   */
  private parisToUtc(year: number, month: number, day: number, hours: number, minutes: number): Date {
    // Build a UTC date at the desired hours
    const guess = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
    // Find the Paris offset at this UTC point
    const offsetMs = this.getTimezoneOffsetMs('Europe/Paris', guess);
    // Correct: desired Paris time = UTC time + offset, so UTC = Paris - offset
    return new Date(guess.getTime() - offsetMs);
  }

  /**
   * Extract Paris calendar date parts from a UTC Date.
   */
  private toParisDateParts(date: Date): { year: number; month: number; date: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    return {
      year: parseInt(parts.find((p) => p.type === 'year')!.value),
      month: parseInt(parts.find((p) => p.type === 'month')!.value) - 1,
      date: parseInt(parts.find((p) => p.type === 'day')!.value),
    };
  }

  /**
   * Returns timezone offset in ms (positive = ahead of UTC).
   * E.g., Europe/Paris in summer (CEST) returns +7200000 (2h).
   */
  private getTimezoneOffsetMs(tz: string, date: Date): number {
    const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzStr = date.toLocaleString('en-US', { timeZone: tz });
    return new Date(tzStr).getTime() - new Date(utcStr).getTime();
  }

  /**
   * Vérifie qu'aucun créneau ne chevauche un autre sur le même jour.
   */
  private validateNoOverlap(slots: Array<{ dayOfWeek: number; startTime: string; endTime: string }>) {
    const byDay = new Map<number, Array<{ start: number; end: number }>>();

    for (const slot of slots) {
      const startMin = this.timeToMinutes(slot.startTime);
      const endMin = this.timeToMinutes(slot.endTime);

      if (startMin >= endMin) {
        throw new BadRequestException(
          `Créneau invalide : ${slot.startTime} doit être avant ${slot.endTime}`,
        );
      }

      const daySlots = byDay.get(slot.dayOfWeek) ?? [];
      for (const existing of daySlots) {
        if (startMin < existing.end && endMin > existing.start) {
          throw new BadRequestException(
            `Chevauchement de créneaux détecté le jour ${slot.dayOfWeek}`,
          );
        }
      }
      daySlots.push({ start: startMin, end: endMin });
      byDay.set(slot.dayOfWeek, daySlots);
    }
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }
}
