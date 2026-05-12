import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import * as path from 'path';
import type { Request } from 'express';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import { EmailService } from '../notifications/email.service';
import { ScoringService } from '../outcomes/scoring.service';
import { CreateMoodDto, CreateJournalEntryDto, UpdateExerciseDto } from './dto/patient-portal.dto';

@Injectable()
export class PatientPortalService {
  private readonly logger = new Logger(PatientPortalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly emailService: EmailService,
    private readonly scoring: ScoringService,
  ) {}

  // ─── PROFIL ──────────────────────────────────────────────────────────────

  async getProfile(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        psychologist: { select: { name: true, specialization: true } },
      },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');
    return patient;
  }

  // ─── MOOD TRACKING ───────────────────────────────────────────────────────

  async createMood(patientId: string, dto: CreateMoodDto) {
    // Chiffrer la note d'humeur (donnée de santé — obligation HDS)
    const encryptedNote = dto.note ? this.encryption.encrypt(dto.note) : null;

    const [moodEntry, patient] = await Promise.all([
      this.prisma.moodTracking.create({
        data: { patientId, mood: dto.mood, note: encryptedNote },
      }),
      this.prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          name: true,
          psychologist: {
            select: {
              name: true,
              user: { select: { email: true } },
            },
          },
        },
      }),
    ]);

    if (patient?.psychologist) {
      // Email générique sans données patient (transit non HDS) — fire-and-forget
      void this.emailService.sendMoodLogged(patient.psychologist.user.email, {
        patientName: patient.name,
        mood: dto.mood,
        note: undefined,
        psychologistName: patient.psychologist.name,
      }).catch((err) => this.logger.error('Failed to send mood email', err));
    }

    // Retourner la note en clair au patient
    return { ...moodEntry, note: dto.note ?? null };
  }

  async getMoodHistory(patientId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const entries = await this.prisma.moodTracking.findMany({
      where: { patientId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, mood: true, note: true, createdAt: true },
    });

    return entries.map((e) => ({
      ...e,
      note: e.note ? this.encryption.decrypt(e.note) : null,
    }));
  }

  // ─── EXERCICES ───────────────────────────────────────────────────────────

  async getExercises(patientId: string) {
    return this.prisma.exercise.findMany({
      where: { patientId },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
  }

  async updateExercise(patientId: string, exerciseId: string, dto: UpdateExerciseDto) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise || exercise.patientId !== patientId) throw new ForbiddenException();

    const updated = await this.prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        status: dto.status,
        patientFeedback: dto.patientFeedback,
        completedAt: dto.status === 'completed' ? new Date() : undefined,
      },
    });

    if (dto.status === 'completed') {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          name: true,
          psychologist: {
            select: {
              name: true,
              user: { select: { email: true } },
            },
          },
        },
      });

      if (patient?.psychologist) {
        // Email générique sans contenu sensible (transit email non HDS)
        await this.emailService.sendExerciseCompleted(patient.psychologist.user.email, {
          patientName: patient.name,
          exerciseTitle: exercise.title,
          feedback: undefined,
          psychologistName: patient.psychologist.name,
        });
      }
    }

    return updated;
  }

  // ─── JOURNAL ─────────────────────────────────────────────────────────────

  async createJournalEntry(patientId: string, dto: CreateJournalEntryDto, userId: string) {
    const encrypted = this.encryption.encrypt(dto.content);

    const entry = await this.prisma.journalEntry.create({
      data: {
        patientId,
        content: encrypted,
        mood: dto.mood,
        tags: dto.tags ?? [],
        isPrivate: dto.isPrivate ?? false,
      },
    });

    await this.audit.log({
      actorId: userId,
      actorType: 'patient',
      action: 'CREATE',
      entityType: 'journal_entry',
      entityId: entry.id,
    });

    return { ...entry, content: dto.content }; // retourner en clair
  }

  async getJournalEntries(patientId: string, userId: string) {
    const entries = await this.prisma.journalEntry.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    await this.audit.log({
      actorId: userId,
      actorType: 'patient',
      action: 'READ',
      entityType: 'journal_entry',
      entityId: patientId,
    });

    return entries.map((e) => {
      let content: string;
      try {
        content = this.encryption.decrypt(e.content);
      } catch {
        content = '[Contenu illisible]';
      }
      return { ...e, content };
    });
  }

  async deleteJournalEntry(patientId: string, entryId: string, userId: string) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.patientId !== patientId) throw new ForbiddenException();

    await this.prisma.journalEntry.delete({ where: { id: entryId } });

    await this.audit.log({
      actorId: userId,
      actorType: 'patient',
      action: 'DELETE',
      entityType: 'journal_entry',
      entityId: entryId,
    });

    return { deleted: true };
  }

  // ─── ASSESSMENTS (patient side) ──────────────────────────────────────────

  async getAssessments(patientId: string) {
    return this.prisma.assessment.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, score: true, severity: true, status: true,
        completedAt: true, createdAt: true,
        template: {
          select: {
            type: true, name: true, description: true,
            maxScore: true, questions: true, scoringRanges: true,
          },
        },
      },
    });
  }

  async submitPatientAssessment(
    assessmentId: string,
    patientId: string,
    answers: Array<{ questionId: string; value: number }>,
  ) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, patientId },
      include: { template: true },
    });
    if (!assessment) throw new NotFoundException('Évaluation introuvable');
    if (assessment.status === 'completed') throw new ForbiddenException('Évaluation déjà complétée');

    const answersMap = answers.reduce(
      (acc, a) => { acc[a.questionId] = a.value; return acc; },
      {} as Record<string, number>,
    );

    const result = this.scoring.score(assessment.template.type, answersMap);
    const encryptedAnswers = this.encryption.encrypt(JSON.stringify(answersMap));

    return this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        answers: encryptedAnswers,
        score: result.score,
        severity: result.severity,
        status: 'completed',
        completedAt: new Date(),
      },
      select: {
        id: true, score: true, severity: true, status: true, completedAt: true,
        template: { select: { type: true, name: true, maxScore: true } },
      },
    });
  }

  // ─── DOCUMENTS ─────────────────────────────────────────────────────────────

  private safeDecryptMessage(value: string | null): string | null {
    if (!value) return null;
    try {
      return this.encryption.decrypt(value);
    } catch {
      return null;
    }
  }

  async getDocuments(patientId: string) {
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

  async downloadDocument(patientId: string, docId: string, userId: string, req?: Request) {
    const doc = await this.prisma.sharedDocument.findFirst({
      where: { id: docId, patientId, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Document introuvable');

    // Defense-in-depth: verify file path is within upload base directory (local storage only)
    // S3 keys don't start with /uploads/documents so skip this check for S3 paths
    if (!doc.filePath.startsWith('documents/')) {
      const resolvedPath = path.resolve(doc.filePath);
      if (!resolvedPath.startsWith(path.resolve('/uploads/documents'))) {
        throw new ForbiddenException('Chemin de fichier invalide');
      }
    }

    // Mark first download
    if (!doc.downloadedAt) {
      await this.prisma.sharedDocument.update({
        where: { id: docId },
        data: { downloadedAt: new Date() },
      });
    }

    // Audit log
    await this.audit.log({
      actorId: userId,
      actorType: 'patient',
      action: 'READ',
      entityType: 'document',
      entityId: docId,
      req,
    });

    return {
      filePath: doc.filePath,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
    };
  }

  // ─── DASHBOARD PATIENT ───────────────────────────────────────────────────

  async getDashboard(patientId: string) {
    const [recentMoods, exercises, nextAppointment, recentJournal, pendingAssessmentsCount, unreadDocuments] = await Promise.all([
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
      this.prisma.exercise.findMany({
        where: { patientId, status: { in: ['assigned', 'in_progress'] } },
        take: 5,
        orderBy: { dueDate: 'asc' },
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
      // Dernières entrées journal (sans contenu déchiffré ici — juste le count)
      this.prisma.journalEntry.count({ where: { patientId } }),
      // Évaluations en attente
      this.prisma.assessment.count({ where: { patientId, status: 'pending' } }),
      // Documents non téléchargés
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
      pendingExercises: exercises,
      nextAppointment,
      journalCount: recentJournal,
      pendingAssessmentsCount,
      unreadDocuments,
    };
  }
}
