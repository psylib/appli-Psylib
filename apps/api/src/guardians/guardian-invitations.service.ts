import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class GuardianInvitationsService {
  private readonly logger = new Logger(GuardianInvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sendInvitation(psychologistId: string, patientId: string, guardianId: string, actorUserId: string) {
    const guardian = await this.prisma.legalGuardian.findFirst({
      where: { id: guardianId, patientId, psychologistId },
      include: { patient: { select: { name: true } } },
    });
    if (!guardian) throw new NotFoundException('Tuteur introuvable');

    // Rate limit: max 3 invitations per guardian per 24h
    const recentCount = await this.prisma.guardianInvitation.count({
      where: {
        guardianId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recentCount >= 3) throw new BadRequestException('Maximum 3 invitations par 24h');

    // Expire any existing pending invitations
    await this.prisma.guardianInvitation.updateMany({
      where: { guardianId, status: 'pending' },
      data: { status: 'expired' },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.guardianInvitation.create({
      data: {
        psychologistId,
        guardianId,
        email: guardian.email,
        token,
        expiresAt,
      },
    });

    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      select: { name: true },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const activationUrl = `${frontendUrl}/guardian-invite/${token}`;

    await this.email.sendGuardianInvitation(guardian.email, {
      guardianName: guardian.name,
      patientFirstName: guardian.patient.name.split(' ')[0] ?? guardian.patient.name,
      psychologistName: psy?.name ?? 'Votre psychologue',
      activationUrl,
    });

    await this.audit.log({
      actorId: actorUserId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'guardian_invitation',
      entityId: invitation.id,
      metadata: { guardianId, patientId },
    });

    return { sent: true, expiresAt };
  }

  async validateToken(token: string) {
    const invitation = await this.prisma.guardianInvitation.findUnique({
      where: { token },
      include: {
        guardian: { select: { name: true, patient: { select: { name: true } } } },
        psychologist: { select: { name: true } },
      },
    });

    if (!invitation) throw new NotFoundException('Invitation introuvable');
    if (invitation.status !== 'pending') throw new BadRequestException('Invitation deja utilisee');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation expiree');

    return {
      guardianName: invitation.guardian.name,
      patientFirstName: invitation.guardian.patient.name.split(' ')[0] ?? invitation.guardian.patient.name,
      psychologistName: invitation.psychologist.name,
      email: invitation.email,
    };
  }

  async acceptInvitation(token: string, password: string) {
    const invitation = await this.prisma.guardianInvitation.findUnique({
      where: { token },
      include: { guardian: true },
    });

    if (!invitation) throw new NotFoundException('Invitation introuvable');
    if (invitation.status !== 'pending') throw new BadRequestException('Invitation deja utilisee');
    if (invitation.expiresAt < new Date()) {
      await this.prisma.guardianInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Invitation expiree');
    }

    // Check if user already exists with this email
    const existing = await this.prisma.user.findUnique({ where: { email: invitation.email } });
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.legalGuardian.update({
          where: { id: invitation.guardianId },
          data: { userId: existing.id },
        }),
        this.prisma.user.update({
          where: { id: existing.id },
          data: { role: 'guardian' },
        }),
        this.prisma.guardianInvitation.update({
          where: { id: invitation.id },
          data: { status: 'accepted' },
        }),
      ]);

      return this.generateGuardianTokens(existing.id, existing.email);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { user } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          role: 'guardian',
        },
      });

      await tx.legalGuardian.update({
        where: { id: invitation.guardianId },
        data: { userId: user.id },
      });

      await tx.guardianInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' },
      });

      return { user };
    });

    this.logger.log(`Guardian ${invitation.guardianId} accepted invitation, user ${user.id} created`);

    return this.generateGuardianTokens(user.id, user.email);
  }

  private generateGuardianTokens(userId: string, email: string) {
    const secret = this.config.getOrThrow<string>('PATIENT_JWT_SECRET');

    const accessToken = this.jwt.sign(
      { sub: userId, role: 'guardian', email },
      { secret, expiresIn: '1h', algorithm: 'HS256' },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, role: 'guardian', type: 'refresh' },
      { secret, expiresIn: '7d', algorithm: 'HS256' },
    );

    return { accessToken, refreshToken, userId, email };
  }
}
