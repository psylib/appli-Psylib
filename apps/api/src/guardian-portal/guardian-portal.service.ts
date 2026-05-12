import { Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';

@Injectable()
export class GuardianPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
  ) {}

  // ─── MINORS LIST ────────────────────────────────────────────────────────────

  /**
   * List all minors linked to this guardian user
   */
  async getMinors(userId: string) {
    const guardianLinks = await this.prisma.legalGuardian.findMany({
      where: { userId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            birthDate: true,
            isMinor: true,
            status: true,
            psychologist: { select: { name: true, specialization: true } },
          },
        },
      },
    });

    return guardianLinks
      .filter((g) => g.patient.isMinor)
      .map((g) => ({
        patientId: g.patient.id,
        patientName: g.patient.name,
        birthDate: g.patient.birthDate,
        status: g.patient.status,
        relationship: g.relationship,
        isPrimary: g.isPrimary,
        psychologistName: g.patient.psychologist.name,
        specialization: g.patient.psychologist.specialization,
      }));
  }

  // ─── DASHBOARD ──────────────────────────────────────────────────────────────

  /**
   * Dashboard for a single minor: mood avg, exercises, next appointment
   */
  async getDashboard(userId: string, patientId: string, req?: Request) {
    await this.audit.logRead(userId, 'guardian', 'patient_dashboard', patientId, req);

    const [recentMoods, pendingExercises, nextAppointment, unreadDocuments] = await Promise.all([
      // 7 derniers jours d'humeur
      this.prisma.moodTracking.findMany({
        where: {
          patientId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'asc' },
        select: { mood: true, createdAt: true },
      }),
      // Exercices en attente
      this.prisma.exercise.count({
        where: { patientId, status: { in: ['assigned', 'in_progress'] } },
      }),
      // Prochain RDV
      this.prisma.appointment.findFirst({
        where: {
          patientId,
          status: { in: ['scheduled', 'confirmed'] },
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: 'asc' },
        select: { scheduledAt: true, duration: true, status: true },
      }),
      // Documents non telecharges
      this.prisma.sharedDocument.count({
        where: { patientId, deletedAt: null, downloadedAt: null },
      }),
    ]);

    const avgMood = recentMoods.length
      ? recentMoods.reduce((s, m) => s + m.mood, 0) / recentMoods.length
      : null;

    return {
      avgMood7d: avgMood ? Math.round(avgMood * 10) / 10 : null,
      moodHistory: recentMoods,
      pendingExercises,
      nextAppointment,
      unreadDocuments,
    };
  }

  // ─── MOOD ───────────────────────────────────────────────────────────────────

  /**
   * Mood history for a minor (read-only)
   */
  async getMood(userId: string, patientId: string, days = 30, req?: Request) {
    await this.audit.logRead(userId, 'guardian', 'mood_tracking', patientId, req);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const entries = await this.prisma.moodTracking.findMany({
      where: { patientId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, mood: true, note: true, createdAt: true },
    });

    return entries.map((e) => {
      let note: string | null = null;
      if (e.note) {
        try {
          note = this.encryption.decrypt(e.note);
        } catch {
          note = null;
        }
      }
      return { ...e, note };
    });
  }

  // ─── EXERCISES ──────────────────────────────────────────────────────────────

  /**
   * Exercises assigned to the minor (read-only)
   */
  async getExercises(userId: string, patientId: string, req?: Request) {
    await this.audit.logRead(userId, 'guardian', 'exercise', patientId, req);

    return this.prisma.exercise.findMany({
      where: { patientId },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueDate: true,
        completedAt: true,
        createdByAi: true,
      },
    });
  }

  // ─── JOURNAL ────────────────────────────────────────────────────────────────

  /**
   * Non-private journal entries for the minor (read-only, decrypted)
   */
  async getJournal(userId: string, patientId: string, req?: Request) {
    await this.audit.logRead(userId, 'guardian', 'journal_entry', patientId, req);

    const entries = await this.prisma.journalEntry.findMany({
      where: { patientId, isPrivate: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Decrypt content and audit
    const decrypted = entries.map((e) => {
      let content: string | null = null;
      try {
        content = this.encryption.decrypt(e.content);
      } catch {
        content = null;
      }
      return {
        id: e.id,
        mood: e.mood,
        tags: e.tags,
        content,
        createdAt: e.createdAt,
      };
    });

    if (entries.length > 0) {
      await this.audit.logDecrypt(userId, 'guardian', 'journal_entry', patientId, 'content', req);
    }

    return decrypted;
  }

  // ─── DOCUMENTS ──────────────────────────────────────────────────────────────

  /**
   * Shared documents for the minor (read-only)
   */
  async getDocuments(userId: string, patientId: string, req?: Request) {
    await this.audit.logRead(userId, 'guardian', 'document', patientId, req);

    const docs = await this.prisma.sharedDocument.findMany({
      where: { patientId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        category: true,
        message: true,
        downloadedAt: true,
        createdAt: true,
      },
    });

    return docs.map((d) => ({
      ...d,
      message: this.safeDecryptMessage(d.message),
    }));
  }

  // ─── INVOICES ───────────────────────────────────────────────────────────────

  /**
   * Invoices for the minor (read-only)
   */
  async getInvoices(userId: string, patientId: string, req?: Request) {
    await this.audit.logRead(userId, 'guardian', 'invoice', patientId, req);

    // Find the psychologistId via the patient
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { psychologistId: true },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    return this.prisma.invoice.findMany({
      where: { patientId, psychologistId: patient.psychologistId },
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        amountTtc: true,
        status: true,
        issuedAt: true,
        pdfUrl: true,
      },
    });
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  private safeDecryptMessage(value: string | null): string | null {
    if (!value) return null;
    try {
      return this.encryption.decrypt(value);
    } catch {
      return null;
    }
  }
}
