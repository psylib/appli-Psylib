import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateConsultationTypeDto } from './dto/create-consultation-type.dto';
import { UpdateConsultationTypeDto } from './dto/update-consultation-type.dto';
import { ConsultationCategory } from '@psyscale/shared-types';

/** Tarif réglementé Mon Soutien Psy — fixé par l'Assurance Maladie */
const MSP_RATE = 50;
const MAX_CONSULTATION_TYPES = 20;

@Injectable()
export class ConsultationTypesService {
  private readonly logger = new Logger(ConsultationTypesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── QUERIES ──────────────────────────────────────────────────────

  /** Tous les types de consultation du psychologue (admin view) */
  async findAll(psychologistId: string) {
    const psy = await this.getPsychologist(psychologistId);

    return this.prisma.consultationType.findMany({
      where: { psychologistId: psy.id },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** Types publics + actifs uniquement (vue booking patient) */
  async findPublic(psychologistId: string) {
    return this.prisma.consultationType.findMany({
      where: {
        psychologistId,
        isActive: true,
        isPublic: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        duration: true,
        rate: true,
        color: true,
        category: true,
      },
    });
  }

  // ─── MUTATIONS ────────────────────────────────────────────────────

  /** Créer un type de consultation */
  async create(psychologistId: string, dto: CreateConsultationTypeDto) {
    const psy = await this.getPsychologist(psychologistId);

    // Limite max 20 types par psychologue
    const count = await this.prisma.consultationType.count({
      where: { psychologistId: psy.id },
    });
    if (count >= MAX_CONSULTATION_TYPES) {
      throw new ForbiddenException(
        `Limite atteinte : maximum ${MAX_CONSULTATION_TYPES} types de consultation`,
      );
    }

    // Forcer le tarif réglementé MSP
    const isMsp = dto.category === ConsultationCategory.MON_SOUTIEN_PSY;
    const rate = isMsp ? MSP_RATE : dto.rate;

    // Calcul du prochain sortOrder
    const maxSort = await this.prisma.consultationType.findFirst({
      where: { psychologistId: psy.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.consultationType.create({
      data: {
        psychologistId: psy.id,
        name: dto.name,
        duration: dto.duration,
        rate,
        color: dto.color ?? '#3D52A0',
        category: dto.category ?? ConsultationCategory.STANDARD,
        isPublic: dto.isPublic ?? true,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    });
  }

  /** Modifier un type de consultation */
  async update(psychologistId: string, id: string, dto: UpdateConsultationTypeDto) {
    const psy = await this.getPsychologist(psychologistId);

    const existing = await this.prisma.consultationType.findFirst({
      where: { id, psychologistId: psy.id },
    });
    if (!existing) {
      throw new NotFoundException('Type de consultation introuvable');
    }

    // Déterminer la catégorie finale
    const category = dto.category ?? existing.category;
    const isMsp = category === ConsultationCategory.MON_SOUTIEN_PSY;

    // Forcer le tarif MSP — même si le psy tente de le modifier
    let rate: number | undefined;
    if (isMsp) {
      rate = MSP_RATE;
    } else if (dto.rate !== undefined) {
      rate = dto.rate;
    }

    return this.prisma.consultationType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(rate !== undefined && { rate }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  /** Désactiver un type (soft delete) */
  async deactivate(psychologistId: string, id: string) {
    const psy = await this.getPsychologist(psychologistId);

    const existing = await this.prisma.consultationType.findFirst({
      where: { id, psychologistId: psy.id },
    });
    if (!existing) {
      throw new NotFoundException('Type de consultation introuvable');
    }

    return this.prisma.consultationType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── DEFAULTS ─────────────────────────────────────────────────────

  /** Créer le type par défaut "Séance individuelle" pour un nouveau psy */
  async createDefaultsForPsy(psychologistId: string, defaultRate: number = 70) {
    const existing = await this.prisma.consultationType.count({
      where: { psychologistId },
    });
    if (existing > 0) return; // Déjà initialisé

    await this.prisma.consultationType.create({
      data: {
        psychologistId,
        name: 'Séance individuelle',
        duration: 60,
        rate: defaultRate,
        color: '#3D52A0',
        category: ConsultationCategory.STANDARD,
        isPublic: true,
        sortOrder: 0,
      },
    });

    this.logger.log(`Type par défaut créé pour psy ${psychologistId}`);
  }

  /** Créer les 2 types MSP réglementés */
  async createMspDefaults(psychologistId: string) {
    const existingMsp = await this.prisma.consultationType.count({
      where: { psychologistId, category: ConsultationCategory.MON_SOUTIEN_PSY },
    });
    if (existingMsp > 0) return; // Déjà créés

    await this.prisma.consultationType.createMany({
      data: [
        {
          psychologistId,
          name: 'Mon Soutien Psy — Évaluation',
          duration: 45,
          rate: MSP_RATE,
          color: '#0D9488',
          category: ConsultationCategory.MON_SOUTIEN_PSY,
          isPublic: true,
          sortOrder: 100,
        },
        {
          psychologistId,
          name: 'Mon Soutien Psy — Suivi',
          duration: 45,
          rate: MSP_RATE,
          color: '#0D9488',
          category: ConsultationCategory.MON_SOUTIEN_PSY,
          isPublic: true,
          sortOrder: 101,
        },
      ],
    });

    this.logger.log(`Types MSP créés pour psy ${psychologistId}`);
  }

  // ─── PRIVATE ──────────────────────────────────────────────────────

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }
}
