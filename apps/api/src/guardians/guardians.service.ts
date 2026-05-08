import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { DEFAULT_GUARDIAN_PERMISSIONS } from '@psyscale/shared-types';

@Injectable()
export class GuardiansService {
  private readonly logger = new Logger(GuardiansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(psychologistId: string, patientId: string, dto: CreateGuardianDto, actorUserId: string) {
    // 1. Verify patient belongs to psy and isMinor
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');
    if (!patient.isMinor) throw new BadRequestException('Ce patient n\'est pas mineur');

    // 2. Check guardian count < 2
    const count = await this.prisma.legalGuardian.count({ where: { patientId } });
    if (count >= 2) throw new BadRequestException('Maximum 2 tuteurs par patient');

    // 3. Email must not match patient email
    if (patient.email && dto.email.toLowerCase() === patient.email.toLowerCase()) {
      throw new BadRequestException('L\'email du tuteur ne peut pas etre identique a celui du patient');
    }

    // 4. Check plan for permissions configuration
    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      include: { subscription: true },
    });
    const plan = psy?.subscription?.plan ?? 'free';

    let permissions = dto.permissions ?? DEFAULT_GUARDIAN_PERMISSIONS;
    if (plan !== 'pro' && plan !== 'clinic') {
      // Solo/Free: use defaults, ignore custom permissions
      permissions = DEFAULT_GUARDIAN_PERMISSIONS;
    }

    // 5. Handle isPrimary constraint
    if (dto.isPrimary) {
      await this.prisma.legalGuardian.updateMany({
        where: { patientId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    // If first guardian, make primary automatically
    const isPrimary = dto.isPrimary ?? (count === 0);

    const guardian = await this.prisma.legalGuardian.create({
      data: {
        patientId,
        psychologistId,
        name: dto.name,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        relationship: dto.relationship,
        isPrimary,
        permissions: permissions as unknown as Record<string, boolean>,
      },
    });

    await this.audit.log({
      actorId: actorUserId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'legal_guardian',
      entityId: guardian.id,
      metadata: { patientId, guardianName: dto.name },
    });

    return guardian;
  }

  async findAll(psychologistId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    return this.prisma.legalGuardian.findMany({
      where: { patientId, psychologistId },
      include: {
        invitations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(
    psychologistId: string,
    patientId: string,
    guardianId: string,
    dto: UpdateGuardianDto,
    actorUserId: string,
  ) {
    const guardian = await this.prisma.legalGuardian.findFirst({
      where: { id: guardianId, patientId, psychologistId },
    });
    if (!guardian) throw new NotFoundException('Tuteur introuvable');

    // Email uniqueness check
    if (dto.email) {
      const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
      if (patient?.email && dto.email.toLowerCase() === patient.email.toLowerCase()) {
        throw new BadRequestException('L\'email du tuteur ne peut pas etre identique a celui du patient');
      }
    }

    // Handle isPrimary swap
    if (dto.isPrimary === true && !guardian.isPrimary) {
      await this.prisma.legalGuardian.updateMany({
        where: { patientId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Plan check for permissions
    if (dto.permissions) {
      const psy = await this.prisma.psychologist.findUnique({
        where: { id: psychologistId },
        include: { subscription: true },
      });
      const plan = psy?.subscription?.plan ?? 'free';
      if (plan !== 'pro' && plan !== 'clinic') {
        delete dto.permissions; // Solo: ignore custom permissions
      }
    }

    const updated = await this.prisma.legalGuardian.update({
      where: { id: guardianId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email.toLowerCase() }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.relationship && { relationship: dto.relationship }),
        ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
        ...(dto.permissions && { permissions: dto.permissions as unknown as Record<string, boolean> }),
      },
    });

    await this.audit.log({
      actorId: actorUserId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'legal_guardian',
      entityId: guardianId,
      metadata: { patientId, changes: Object.keys(dto) },
    });

    return updated;
  }

  async remove(psychologistId: string, patientId: string, guardianId: string, actorUserId: string) {
    const guardian = await this.prisma.legalGuardian.findFirst({
      where: { id: guardianId, patientId, psychologistId },
    });
    if (!guardian) throw new NotFoundException('Tuteur introuvable');

    // If guardian had a user account, deactivate it
    if (guardian.userId) {
      const otherLinks = await this.prisma.legalGuardian.count({
        where: { userId: guardian.userId, id: { not: guardianId } },
      });
      if (otherLinks === 0) {
        await this.prisma.user.update({
          where: { id: guardian.userId },
          data: { role: 'patient' },
        });
      }
    }

    await this.prisma.legalGuardian.delete({ where: { id: guardianId } });

    await this.audit.log({
      actorId: actorUserId,
      actorType: 'psychologist',
      action: 'DELETE',
      entityType: 'legal_guardian',
      entityId: guardianId,
      metadata: { patientId, guardianName: guardian.name },
    });

    return { deleted: true };
  }
}
