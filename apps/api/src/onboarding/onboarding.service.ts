import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, MinLength, IsInt, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../notifications/email.service';
import { ConfigService } from '@nestjs/config';

export class UpdatePsychologistProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  adeliNumber?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  @IsOptional()
  @Type(() => Number)
  defaultSessionDuration?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  defaultSessionRate?: number;

  // Reminder settings
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(72)
  @IsOptional()
  @Type(() => Number)
  reminderDelay?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  reminderEmailEnabled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  reminderSmsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reminderTemplate?: string;

  // Online payment settings
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  allowOnlinePayment?: boolean;

  // Mon Soutien Psy
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  acceptsMonSoutienPsy?: boolean;
}

export type OnboardingStep =
  | 'profile'
  | 'practice'
  | 'preferences'
  | 'first_patient'
  | 'billing';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async getProgress(userId: string) {
    const psy = await this.getPsychologist(userId);

    const progress = await this.prisma.onboardingProgress.findUnique({
      where: { psychologistId: psy.id },
    });

    if (!progress) {
      // Créer l'enregistrement si inexistant
      return this.prisma.onboardingProgress.create({
        data: {
          psychologistId: psy.id,
          stepsCompleted: [],
        },
      });
    }

    return progress;
  }

  async completeStep(userId: string, step: OnboardingStep) {
    const psy = await this.getPsychologist(userId);

    const progress = await this.getProgress(userId);
    const steps = new Set(progress.stepsCompleted);
    steps.add(step);

    const allSteps: OnboardingStep[] = ['profile', 'practice', 'preferences', 'first_patient', 'billing'];
    const isCompleted = allSteps.every((s) => steps.has(s));

    return this.prisma.onboardingProgress.update({
      where: { psychologistId: psy.id },
      data: {
        stepsCompleted: Array.from(steps),
        completedAt: isCompleted ? new Date() : null,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdatePsychologistProfileDto) {
    const psy = await this.getPsychologist(userId);

    // Générer un slug si non existant
    let slug = psy.slug;
    if (dto.name && !psy.slug) {
      slug = this.generateSlug(dto.name);
    }

    const updated = await this.prisma.psychologist.update({
      where: { id: psy.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(slug !== psy.slug && { slug }),
        ...(dto.specialization !== undefined && { specialization: dto.specialization }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.adeliNumber !== undefined && { adeliNumber: dto.adeliNumber }),
        ...(dto.defaultSessionDuration !== undefined && { defaultSessionDuration: dto.defaultSessionDuration }),
        ...(dto.defaultSessionRate !== undefined && { defaultSessionRate: dto.defaultSessionRate }),
        ...(dto.reminderDelay !== undefined && { reminderDelay: dto.reminderDelay }),
        ...(dto.reminderEmailEnabled !== undefined && { reminderEmailEnabled: dto.reminderEmailEnabled }),
        ...(dto.reminderSmsEnabled !== undefined && { reminderSmsEnabled: dto.reminderSmsEnabled }),
        ...(dto.reminderTemplate !== undefined && { reminderTemplate: dto.reminderTemplate }),
        ...(dto.allowOnlinePayment !== undefined && { allowOnlinePayment: dto.allowOnlinePayment }),
        ...(dto.acceptsMonSoutienPsy !== undefined && { acceptsMonSoutienPsy: dto.acceptsMonSoutienPsy }),
      },
    });

    // Marquer l'étape profile comme complète
    await this.completeStep(userId, 'profile');

    return updated;
  }

  async markOnboarded(userId: string) {
    const psy = await this.getPsychologist(userId);

    const updated = await this.prisma.psychologist.update({
      where: { id: psy.id },
      data: { isOnboarded: true },
    });

    // Email de bienvenue
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const dashboardUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
      void this.email.sendWelcomeEmail(user.email, {
        psychologistName: psy.name,
        dashboardUrl: `${dashboardUrl}/dashboard`,
      });
    }

    return updated;
  }

  async getPsychologistProfile(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId },
      include: { subscription: true },
    });
    if (!psy) {
      // Auto-créer le profil si inexistant (premier login Keycloak)
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Utilisateur introuvable');

      return this.prisma.psychologist.create({
        data: {
          userId,
          name: user.email.split('@')[0] ?? 'Nouveau praticien',
          slug: this.generateSlug(user.email.split('@')[0] ?? 'praticien'),
          isOnboarded: false,
        },
        include: { subscription: true },
      });
    }
    return psy;
  }

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Math.random().toString(36).slice(2, 7)
    );
  }
}
