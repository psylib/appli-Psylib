import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import { DocumentsService } from '../documents/documents.service';
import { CreatePatientDto, UpdatePatientDto, PatientQueryDto, CreateExerciseDto } from './dto/create-patient.dto';
import type { ImportPatientRowDto, ImportPatientsReport } from './dto/import-patients.dto';
import { PaginatedResponse, PLAN_LIMITS, SubscriptionPlan } from '@psyscale/shared-types';
import type { Patient, Prisma } from '@prisma/client';
import type { Request } from 'express';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly documentsService: DocumentsService,
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
        isMinor: dto.isMinor ?? false,
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
  ): Promise<PaginatedResponse<Omit<Patient, 'notes'> & { portalStatus: 'none' | 'pending' | 'active' }>> {
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
          isMinor: true,
          status: true,
          source: true,
          createdAt: true,
          invitations: {
            where: { status: 'pending' },
            select: { status: true },
            take: 1,
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    await this.audit.logRead(actorId, 'psychologist', 'patients', 'list', req);

    const data = patients.map(({ invitations, ...patient }) => ({
      ...patient,
      portalStatus: patient.userId
        ? 'active' as const
        : (invitations?.length ?? 0) > 0
          ? 'pending' as const
          : 'none' as const,
    }));

    return {
      data,
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
      include: { guardians: true },
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

  /**
   * Variante ADMIN de findOne() — destinée au rôle `assistant`.
   * NE déchiffre JAMAIS les notes cliniques et ne les retourne pas du tout.
   * Renvoie uniquement les champs administratifs + infos portail/invitations/exercices
   * (métadonnées non cliniques). Aucune donnée de session/notes/clinique n'est exposée.
   */
  async findOneAdmin(
    psychologistId: string,
    patientId: string,
    actorId: string,
    req?: Request,
  ): Promise<Omit<Patient, 'notes'> & { guardians: unknown[] }> {
    const psy = await this.getPsychologist(psychologistId);

    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        psychologistId: psy.id, // isolation tenant
      },
      select: {
        id: true,
        psychologistId: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        isMinor: true,
        status: true,
        source: true,
        createdAt: true,
        // notes: VOLONTAIREMENT EXCLU (donnée clinique chiffrée)
        guardians: true,
      },
    });

    if (!patient) throw new NotFoundException('Patient introuvable');

    await this.audit.logRead(actorId, 'assistant', 'patient', patientId, req);

    return patient as unknown as Omit<Patient, 'notes'> & { guardians: unknown[] };
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
        ...(dto.isMinor !== undefined && { isMinor: dto.isMinor }),
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

    // Delete shared documents files before cascade delete
    await this.documentsService.purgePatientDocuments(psy.id, patientId);

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

  async createExercise(
    psychologistUserId: string,
    patientId: string,
    dto: CreateExerciseDto,
  ) {
    const psy = await this.getPsychologist(psychologistUserId);
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    return this.prisma.exercise.create({
      data: {
        patientId,
        title: dto.title,
        description: dto.description,
        status: 'assigned',
        createdByAi: dto.createdByAi,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }

  // ─── IMPORT EN MASSE (migration depuis un autre logiciel) ───────────────────

  async importPatients(
    psychologistUserId: string,
    rows: ImportPatientRowDto[],
    actorId: string,
    req?: Request,
  ): Promise<ImportPatientsReport> {
    const psy = await this.getPsychologist(psychologistUserId);

    const report: ImportPatientsReport = {
      total: rows.length,
      imported: 0,
      skippedDuplicates: [],
      invalid: [],
      warnings: [],
    };

    // Patients existants pour la déduplication (email fort, sinon nom normalisé)
    const existing = await this.prisma.patient.findMany({
      where: { psychologistId: psy.id },
      select: { email: true, name: true },
    });
    const existingEmails = new Set(
      existing.map((p) => p.email?.trim().toLowerCase()).filter(Boolean) as string[],
    );
    const existingNames = new Set(existing.map((p) => this.normalizeName(p.name)));

    // Déduplication intra-fichier
    const seenInBatch = new Set<string>();

    const toCreate: Prisma.PatientCreateManyInput[] = [];

    rows.forEach((raw, i) => {
      const humanRow = i + 1;
      const name = (raw.name ?? '').trim();
      if (!name) {
        report.invalid.push({ row: humanRow, reason: 'Nom manquant' });
        return;
      }

      // Email : on tolère un email invalide (fréquent dans les exports) → on l'ignore
      let email: string | null = null;
      const rawEmail = raw.email?.trim().toLowerCase();
      if (rawEmail) {
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
          email = rawEmail;
        } else {
          report.warnings.push({ row: humanRow, name, reason: `Email ignoré (format invalide : "${raw.email}")` });
        }
      }

      const phone = raw.phone?.trim() || null;

      // Date de naissance : formats FR tolérés
      let birthDate: Date | null = null;
      if (raw.birthDate?.trim()) {
        const parsed = this.parseImportDate(raw.birthDate.trim());
        if (parsed) {
          birthDate = parsed;
        } else {
          report.warnings.push({ row: humanRow, name, reason: `Date de naissance ignorée (illisible : "${raw.birthDate}")` });
        }
      }

      // Clé de déduplication
      const dedupKey = email ?? `${this.normalizeName(name)}|${birthDate ? birthDate.toISOString().slice(0, 10) : ''}`;

      if (seenInBatch.has(dedupKey)) {
        report.skippedDuplicates.push({ row: humanRow, name, reason: 'Doublon dans le fichier' });
        return;
      }
      if (email && existingEmails.has(email)) {
        report.skippedDuplicates.push({ row: humanRow, name, reason: 'Email déjà présent dans vos patients' });
        return;
      }
      if (!email && existingNames.has(this.normalizeName(name))) {
        report.skippedDuplicates.push({ row: humanRow, name, reason: 'Nom déjà présent dans vos patients' });
        return;
      }

      seenInBatch.add(dedupKey);

      toCreate.push({
        psychologistId: psy.id,
        name: name.slice(0, 100),
        email,
        phone,
        birthDate,
        notes: raw.notes?.trim() ? this.encryption.encrypt(raw.notes.trim()) : null,
        source: raw.source?.trim() || 'import',
      });
    });

    // Vérification de la limite de plan (le plan Free est plafonné)
    const sub = await this.prisma.subscription.findUnique({ where: { psychologistId: psy.id } });
    const plan = (sub?.plan ?? SubscriptionPlan.FREE) as SubscriptionPlan;
    const limit = PLAN_LIMITS[plan].patients; // null = illimité

    if (limit !== null && toCreate.length > 0) {
      const activeCount = await this.prisma.patient.count({
        where: { psychologistId: psy.id, status: { not: 'archived' } },
      });
      if (activeCount + toCreate.length > limit) {
        const remaining = Math.max(0, limit - activeCount);
        throw new ForbiddenException({
          code: 'PATIENT_LIMIT',
          currentPlan: plan,
          currentUsage: activeCount,
          limit,
          attempted: toCreate.length,
          remaining,
          message: `Votre plan ${plan} est limité à ${limit} patients (${activeCount} déjà enregistrés). Cet import en ajouterait ${toCreate.length}. Passez à un plan supérieur pour importer l'ensemble de votre patientèle.`,
        });
      }
    }

    if (toCreate.length > 0) {
      const result = await this.prisma.patient.createMany({ data: toCreate });
      report.imported = result.count;
    }

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'patient',
      entityId: psy.id,
      metadata: {
        import: true,
        imported: report.imported,
        total: report.total,
        duplicates: report.skippedDuplicates.length,
        invalid: report.invalid.length,
      },
      req,
    });

    this.logger.log(
      `[IMPORT] psy=${psy.id} importés=${report.imported}/${report.total} doublons=${report.skippedDuplicates.length}`,
    );

    return report;
  }

  /** Normalise un nom pour comparaison (minuscules, accents retirés, espaces compactés) */
  private normalizeName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Parse une date d'import tolérante aux formats réels (FR jour-en-premier) :
   * YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY. Retourne null si illisible
   * ou hors période plausible (1900 → aujourd'hui).
   */
  private parseImportDate(raw: string): Date | null {
    let y: number, m: number, d: number;

    const iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    const fr = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);

    if (iso) {
      y = +iso[1]!; m = +iso[2]!; d = +iso[3]!;
    } else if (fr) {
      d = +fr[1]!; m = +fr[2]!; y = +fr[3]!;
      if (y < 100) y += y > 30 ? 1900 : 2000; // 85 → 1985, 12 → 2012
    } else {
      return null;
    }

    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const currentYear = new Date().getFullYear();
    if (y < 1900 || y > currentYear) return null;

    const date = new Date(Date.UTC(y, m - 1, d));
    // Rejette les dates "débordées" (ex: 31/02) que Date corrige silencieusement
    if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
    return date;
  }

  // ─── EXPORT CSV (tous les patients) ────────────────────────────────────────

  async exportAllCsv(psychologistId: string): Promise<string> {
    const psy = await this.getPsychologist(psychologistId);

    const patients = await this.prisma.patient.findMany({
      where: { psychologistId: psy.id },
      orderBy: { createdAt: 'asc' },
    });

    const csvCell = (v: string | null | undefined): string => {
      if (!v) return '""';
      let safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
      safe = safe.replace(/"/g, '""');
      return `"${safe}"`;
    };

    const header = 'id,nom,email,téléphone,statut,source,date_naissance,date_création';
    const rows = patients.map((p) =>
      [
        csvCell(p.id),
        csvCell(p.name),
        csvCell(p.email),
        csvCell(p.phone),
        csvCell(p.status),
        csvCell(p.source),
        csvCell(p.birthDate ? p.birthDate.toISOString().split('T')[0] : null),
        csvCell(p.createdAt.toISOString().split('T')[0]),
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
        answers: decryptSafe(a.answers),
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
