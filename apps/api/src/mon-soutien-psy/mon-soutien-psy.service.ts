import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MonSoutienPsyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Increment MSP session counter for a patient (upserts the tracking row).
   * Sends notifications when quota is near (>=10) or reached (>=12).
   */
  async incrementSessionCount(psychologistId: string, patientId: string) {
    const year = new Date().getFullYear();

    const tracking = await this.prisma.monSoutienPsyTracking.upsert({
      where: {
        psychologistId_patientId_year: { psychologistId, patientId, year },
      },
      create: {
        psychologistId,
        patientId,
        year,
        sessionsUsed: 1,
        firstSessionAt: new Date(),
        lastSessionAt: new Date(),
      },
      update: {
        sessionsUsed: { increment: 1 },
        lastSessionAt: new Date(),
      },
      include: { patient: { select: { name: true } } },
    });

    // Resolve psy userId for notifications
    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      select: { userId: true },
    });

    if (psy) {
      const patientName = (tracking as { patient: { name: string } }).patient
        .name;

      if (tracking.sessionsUsed >= tracking.maxSessions) {
        await this.notifications.createNotification(
          psy.userId,
          'msp_quota_reached',
          'Quota Mon Soutien Psy atteint',
          `${patientName} a utilisé ${tracking.sessionsUsed}/${tracking.maxSessions} séances Mon Soutien Psy pour ${year}.`,
        );
      } else if (tracking.sessionsUsed >= 10) {
        await this.notifications.createNotification(
          psy.userId,
          'msp_near_quota',
          'Quota Mon Soutien Psy bientôt atteint',
          `${patientName} a utilisé ${tracking.sessionsUsed}/${tracking.maxSessions} séances Mon Soutien Psy.`,
        );
      }
    }

    return tracking;
  }

  /**
   * Decrement MSP session counter (e.g. when a session is deleted).
   * Returns null if no tracking found, or the tracking unchanged if already 0.
   */
  async decrementSessionCount(psychologistId: string, patientId: string) {
    const year = new Date().getFullYear();

    const tracking = await this.prisma.monSoutienPsyTracking.findUnique({
      where: {
        psychologistId_patientId_year: { psychologistId, patientId, year },
      },
    });

    if (!tracking) return null;
    if (tracking.sessionsUsed <= 0) return tracking;

    return this.prisma.monSoutienPsyTracking.update({
      where: { id: tracking.id },
      data: { sessionsUsed: { decrement: 1 } },
    });
  }

  /**
   * Get tracking for a specific patient in the current year.
   */
  async getPatientTracking(psychologistId: string, patientId: string) {
    const year = new Date().getFullYear();

    return this.prisma.monSoutienPsyTracking.findUnique({
      where: {
        psychologistId_patientId_year: { psychologistId, patientId, year },
      },
    });
  }

  /**
   * Overview of all MSP patients for a psychologist in the current year.
   */
  async getOverview(psychologistId: string) {
    const year = new Date().getFullYear();

    return this.prisma.monSoutienPsyTracking.findMany({
      where: { psychologistId, year },
      include: { patient: { select: { name: true, email: true } } },
      orderBy: { sessionsUsed: 'desc' },
    });
  }

  /**
   * Full history of MSP tracking across all years for a patient.
   */
  async getPatientHistory(psychologistId: string, patientId: string) {
    return this.prisma.monSoutienPsyTracking.findMany({
      where: { psychologistId, patientId },
      orderBy: { year: 'desc' },
    });
  }

  /**
   * Check if the patient has reached their MSP quota.
   */
  isQuotaReached(
    tracking: { sessionsUsed: number; maxSessions: number } | null,
  ): boolean {
    if (!tracking) return false;
    return tracking.sessionsUsed >= tracking.maxSessions;
  }

  /**
   * Check if the patient is near their MSP quota (>=10 sessions).
   */
  isNearQuota(
    tracking: { sessionsUsed: number; maxSessions: number } | null,
  ): boolean {
    if (!tracking) return false;
    return tracking.sessionsUsed >= 10;
  }
}
