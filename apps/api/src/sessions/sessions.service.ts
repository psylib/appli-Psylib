import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import {
  CreateSessionDto,
  UpdateSessionDto,
  SessionQueryDto,
} from './dto/session.dto';
import type { PaginatedResponse } from '@psyscale/shared-types';
import type { Session, Prisma } from '@prisma/client';
import type { Request } from 'express';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
  ) {}

  async create(
    psychologistUserId: string,
    dto: CreateSessionDto,
    actorId: string,
    req?: Request,
  ): Promise<Session> {
    const psy = await this.getPsychologist(psychologistUserId);

    // Vérifier que le patient appartient à ce psy (isolation tenant)
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, psychologistId: psy.id },
    });
    if (!patient) throw new NotFoundException('Patient introuvable ou non autorisé');

    const session = await this.prisma.session.create({
      data: {
        patientId: dto.patientId,
        psychologistId: psy.id,
        date: new Date(dto.date),
        duration: dto.duration,
        type: dto.type ?? 'individual',
        notes: dto.notes ? this.encryption.encrypt(dto.notes) : null,
        tags: dto.tags ?? [],
        rate: dto.rate ?? null,
        paymentStatus: 'pending',
        ...(dto.orientation !== undefined && { orientation: dto.orientation }),
        ...(dto.templateId !== undefined && { templateId: dto.templateId }),
      },
    });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'session',
      entityId: session.id,
      req,
    });

    return session;
  }

  async findAll(
    psychologistUserId: string,
    query: SessionQueryDto,
    actorId: string,
    req?: Request,
  ): Promise<PaginatedResponse<Omit<Session, 'notes' | 'summaryAi'>>> {
    const psy = await this.getPsychologist(psychologistUserId);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const dateFilter: Prisma.DateTimeFilter | undefined =
      query.from && query.to ? { gte: new Date(query.from), lte: new Date(query.to) } :
      query.from ? { gte: new Date(query.from) } :
      query.to ? { lte: new Date(query.to) } :
      undefined;

    const where: Prisma.SessionWhereInput = {
      psychologistId: psy.id,
      ...(query.patientId && { patientId: query.patientId }),
      ...(dateFilter && { date: dateFilter }),
    };

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          patientId: true,
          psychologistId: true,
          date: true,
          duration: true,
          type: true,
          notes: false, // jamais en liste
          summaryAi: false,
          tags: true,
          rate: true,
          paymentStatus: true,
          createdAt: true,
          patient: { select: { name: true, status: true } },
        },
      }),
      this.prisma.session.count({ where }),
    ]);

    await this.audit.logRead(actorId, 'psychologist', 'sessions', 'list', req);

    return {
      data: sessions as unknown as Omit<Session, 'notes' | 'summaryAi'>[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    psychologistUserId: string,
    sessionId: string,
    actorId: string,
    req?: Request,
  ): Promise<Session & { notes: string | null; summaryAi: string | null }> {
    const psy = await this.getPsychologist(psychologistUserId);

    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, psychologistId: psy.id },
      include: { patient: { select: { name: true, status: true } } },
    });

    if (!session) throw new NotFoundException('Séance introuvable');

    // Déchiffrer les champs sensibles + audit
    let decryptedNotes: string | null = null;
    let decryptedSummary: string | null = null;

    if (session.notes) {
      decryptedNotes = this.encryption.decrypt(session.notes);
      await this.audit.logDecrypt(actorId, 'psychologist', 'session', sessionId, 'notes', req);
    }

    if (session.summaryAi) {
      decryptedSummary = this.encryption.decrypt(session.summaryAi);
      await this.audit.logDecrypt(actorId, 'psychologist', 'session', sessionId, 'summary_ai', req);
    }

    await this.audit.logRead(actorId, 'psychologist', 'session', sessionId, req);

    return { ...session, notes: decryptedNotes, summaryAi: decryptedSummary };
  }

  async update(
    psychologistUserId: string,
    sessionId: string,
    dto: UpdateSessionDto,
    actorId: string,
    req?: Request,
  ): Promise<Session> {
    const psy = await this.getPsychologist(psychologistUserId);

    const existing = await this.prisma.session.findFirst({
      where: { id: sessionId, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('Séance introuvable');

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.notes !== undefined && {
          notes: dto.notes ? this.encryption.encrypt(dto.notes) : null,
        }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.rate !== undefined && { rate: dto.rate }),
        ...(dto.paymentStatus !== undefined && { paymentStatus: dto.paymentStatus }),
        ...(dto.orientation !== undefined && { orientation: dto.orientation }),
        ...(dto.templateId !== undefined && { templateId: dto.templateId }),
      },
    });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'session',
      entityId: sessionId,
      metadata: { fields: Object.keys(dto) },
      req,
    });

    return updated;
  }

  /**
   * Sauvegarde automatique des notes (autosave 30s)
   * Endpoint optimisé — ne touche que le champ notes
   */
  async autosaveNotes(
    psychologistUserId: string,
    sessionId: string,
    notes: string,
    actorId: string,
  ): Promise<{ saved: boolean; at: string }> {
    const psy = await this.getPsychologist(psychologistUserId);

    const existing = await this.prisma.session.findFirst({
      where: { id: sessionId, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('Séance introuvable');

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { notes: notes ? this.encryption.encrypt(notes) : null },
    });

    return { saved: true, at: new Date().toISOString() };
  }

  async getMonthlyStats(psychologistUserId: string): Promise<{
    totalThisMonth: number;
    totalLastMonth: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
  }> {
    const psy = await this.getPsychologist(psychologistUserId);
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonth, lastMonth] = await Promise.all([
      this.prisma.session.findMany({
        where: { psychologistId: psy.id, date: { gte: firstOfMonth } },
        select: { rate: true, paymentStatus: true },
      }),
      this.prisma.session.findMany({
        where: {
          psychologistId: psy.id,
          date: { gte: firstOfLastMonth, lte: lastOfLastMonth },
        },
        select: { rate: true, paymentStatus: true },
      }),
    ]);

    const sumRevenue = (sessions: { rate: unknown; paymentStatus: string }[]) =>
      sessions
        .filter((s) => s.paymentStatus === 'paid')
        .reduce((acc, s) => acc + (Number(s.rate) || 0), 0);

    return {
      totalThisMonth: thisMonth.length,
      totalLastMonth: lastMonth.length,
      revenueThisMonth: sumRevenue(thisMonth),
      revenueLastMonth: sumRevenue(lastMonth),
    };
  }

  // ─── EXPORT CSV (toutes les séances) ────────────────────────────────────────

  async exportAllCsv(psychologistId: string): Promise<string> {
    const psy = await this.getPsychologist(psychologistId);

    const sessions = await this.prisma.session.findMany({
      where: { psychologistId: psy.id },
      orderBy: { date: 'desc' },
      include: { patient: { select: { name: true } } },
    });

    const escape = (v: string | null | undefined) =>
      v ? `"${v.replace(/"/g, '""')}"` : '';

    const header = 'id,date,patient,durée_min,type,statut_paiement,montant_eur,tags';
    const rows = sessions.map((s) =>
      [
        s.id,
        s.date.toISOString().split('T')[0],
        escape(s.patient.name),
        s.duration,
        s.type,
        s.paymentStatus,
        s.rate ? Number(s.rate).toFixed(2) : '0.00',
        escape(s.tags.join('; ')),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }
}
