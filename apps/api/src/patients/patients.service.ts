import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import { CreatePatientDto, UpdatePatientDto, PatientQueryDto } from './dto/create-patient.dto';
import type { PaginatedResponse } from '@psyscale/shared-types';
import type { Patient, Prisma } from '@prisma/client';
import type { Request } from 'express';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
  ) {}

  async create(
    psychologistId: string,
    dto: CreatePatientDto,
    actorId: string,
    req?: Request,
  ): Promise<Patient> {
    // Trouver le psychologist
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId: psychologistId },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const patient = await this.prisma.patient.create({
      data: {
        psychologistId: psy.id,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        notes: dto.notes ? this.encryption.encrypt(dto.notes) : null,
        source: dto.source ?? null,
      },
    });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'patient',
      entityId: patient.id,
      req,
    });

    return patient;
  }

  async findAll(
    psychologistId: string,
    query: PatientQueryDto,
    actorId: string,
    req?: Request,
  ): Promise<PaginatedResponse<Omit<Patient, 'notes'>>> {
    const psy = await this.getPsychologist(psychologistId);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = {
      psychologistId: psy.id,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          psychologistId: true,
          userId: true,
          name: true,
          email: true,
          phone: true,
          birthDate: true,
          notes: false, // jamais en liste — performance + sécurité
          status: true,
          source: true,
          createdAt: true,
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    await this.audit.logRead(actorId, 'psychologist', 'patients', 'list', req);

    return {
      data: patients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    psychologistId: string,
    patientId: string,
    actorId: string,
    req?: Request,
  ): Promise<Patient & { notes: string | null }> {
    const psy = await this.getPsychologist(psychologistId);

    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        psychologistId: psy.id, // isolation tenant
      },
    });

    if (!patient) throw new NotFoundException('Patient introuvable');

    // Déchiffrer les notes + audit DECRYPT (HDS obligatoire)
    let decryptedNotes: string | null = null;
    if (patient.notes) {
      decryptedNotes = this.encryption.decrypt(patient.notes);
      await this.audit.logDecrypt(actorId, 'psychologist', 'patient', patientId, 'notes', req);
    }

    await this.audit.logRead(actorId, 'psychologist', 'patient', patientId, req);

    return { ...patient, notes: decryptedNotes };
  }

  async update(
    psychologistId: string,
    patientId: string,
    dto: UpdatePatientDto,
    actorId: string,
    req?: Request,
  ): Promise<Patient> {
    const psy = await this.getPsychologist(psychologistId);

    // Vérifier appartenance tenant
    const existing = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('Patient introuvable');

    const updated = await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.birthDate !== undefined && { birthDate: new Date(dto.birthDate) }),
        ...(dto.notes !== undefined && {
          notes: dto.notes ? this.encryption.encrypt(dto.notes) : null,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.source !== undefined && { source: dto.source }),
      },
    });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'patient',
      entityId: patientId,
      metadata: { fields: Object.keys(dto) },
      req,
    });

    return updated;
  }

  async archive(
    psychologistId: string,
    patientId: string,
    actorId: string,
    req?: Request,
  ): Promise<Patient> {
    const psy = await this.getPsychologist(psychologistId);

    const existing = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('Patient introuvable');

    const archived = await this.prisma.patient.update({
      where: { id: patientId },
      data: { status: 'archived' },
    });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'DELETE',
      entityType: 'patient',
      entityId: patientId,
      metadata: { soft: true },
      req,
    });

    return archived;
  }

  async purge(
    psychologistId: string,
    patientId: string,
    actorId: string,
    req?: Request,
  ): Promise<void> {
    const psy = await this.getPsychologist(psychologistId);

    const existing = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('Patient introuvable');

    // Suppression en cascade (Prisma gère via onDelete: Cascade)
    await this.prisma.patient.delete({ where: { id: patientId } });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'DELETE',
      entityType: 'patient',
      entityId: patientId,
      metadata: { purge: true, gdpr: true },
      req,
    });

    this.logger.log(`[RGPD] Patient purge: ${patientId} by ${actorId}`);
  }

  async getStats(psychologistId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    archived: number;
    newThisMonth: number;
  }> {
    const psy = await this.getPsychologist(psychologistId);
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [total, active, inactive, archived, newThisMonth] = await Promise.all([
      this.prisma.patient.count({ where: { psychologistId: psy.id } }),
      this.prisma.patient.count({ where: { psychologistId: psy.id, status: 'active' } }),
      this.prisma.patient.count({ where: { psychologistId: psy.id, status: 'inactive' } }),
      this.prisma.patient.count({ where: { psychologistId: psy.id, status: 'archived' } }),
      this.prisma.patient.count({
        where: { psychologistId: psy.id, createdAt: { gte: firstOfMonth } },
      }),
    ]);

    return { total, active, inactive, archived, newThisMonth };
  }

  async getPatientPortalMood(
    psychologistId: string,
    patientId: string,
  ) {
    const psy = await this.getPsychologist(psychologistId);
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    const since = new Date();
    since.setDate(since.getDate() - 30);

    return this.prisma.moodTracking.findMany({
      where: { patientId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, mood: true, note: true, createdAt: true },
    });
  }

  async getPatientPortalExercises(
    psychologistId: string,
    patientId: string,
  ) {
    const psy = await this.getPsychologist(psychologistId);
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    return this.prisma.exercise.findMany({
      where: { patientId },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
  }

  // ─── EXPORT CSV (tous les patients) ────────────────────────────────────────

  async exportAllCsv(psychologistId: string): Promise<string> {
    const psy = await this.getPsychologist(psychologistId);

    const patients = await this.prisma.patient.findMany({
      where: { psychologistId: psy.id },
      orderBy: { createdAt: 'asc' },
    });

    const escape = (v: string | null | undefined) =>
      v ? `"${v.replace(/"/g, '""')}"` : '';

    const header = 'id,nom,email,téléphone,statut,source,date_naissance,date_création';
    const rows = patients.map((p) =>
      [
        p.id,
        escape(p.name),
        escape(p.email),
        escape(p.phone),
        p.status,
        p.source ?? '',
        p.birthDate ? p.birthDate.toISOString().split('T')[0] : '',
        p.createdAt.toISOString().split('T')[0],
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  // ─── EXPORT RGPD (dossier complet d'un patient) ─────────────────────────────

  async exportPatientRgpd(psychologistId: string, patientId: string): Promise<object> {
    const psy = await this.getPsychologist(psychologistId);

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
      include: {
        sessions: { orderBy: { date: 'asc' } },
        appointments: { orderBy: { scheduledAt: 'asc' } },
        moodTrackings: { orderBy: { createdAt: 'asc' } },
        exercises: { orderBy: { dueDate: 'asc' } },
        assessments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    const decryptSafe = (v: string | null) => {
      if (!v) return null;
      try { return this.encryption.decrypt(v); } catch { return '[chiffré]'; }
    };

    return {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        birthDate: patient.birthDate,
        status: patient.status,
        source: patient.source,
        notes: decryptSafe(patient.notes),
        createdAt: patient.createdAt,
      },
      sessions: patient.sessions.map((s) => ({
        id: s.id,
        date: s.date,
        duration: s.duration,
        type: s.type,
        notes: decryptSafe(s.notes),
        summaryAi: decryptSafe(s.summaryAi),
        tags: s.tags,
        rate: s.rate,
        paymentStatus: s.paymentStatus,
      })),
      appointments: patient.appointments.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt,
        duration: a.duration,
        status: a.status,
        source: a.source,
      })),
      moodTracking: patient.moodTrackings.map((m) => ({
        mood: m.mood,
        note: m.note,
        date: m.createdAt,
      })),
      exercises: patient.exercises.map((e) => ({
        title: e.title,
        status: e.status,
        dueDate: e.dueDate,
        completedAt: e.completedAt,
        patientFeedback: e.patientFeedback,
      })),
      assessments: patient.assessments.map((a) => ({
        templateId: a.templateId,
        score: a.score,
        severity: a.severity,
        answers: a.answers,
        completedAt: a.completedAt,
        date: a.createdAt,
      })),
    };
  }

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }
}
