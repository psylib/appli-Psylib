import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../notifications/email.service';
import { AcceptInvitationDto, PatientLoginDto } from './dto/patient-auth.dto';

@Injectable()
export class PatientAuthService {
  private readonly logger = new Logger(PatientAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Accepte une invitation patient — crée le compte User et lie au Patient
   */
  async acceptInvitation(dto: AcceptInvitationDto) {
    const invitation = await this.prisma.patientInvitation.findUnique({
      where: { token: dto.token },
      include: {
        patient: true,
        psychologist: {
          include: { user: { select: { email: true } } },
        },
      },
    });

    if (!invitation) throw new NotFoundException('Invitation introuvable');
    if (invitation.status !== 'pending') throw new BadRequestException('Invitation déjà utilisée ou expirée');
    if (invitation.expiresAt < new Date()) {
      await this.prisma.patientInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Invitation expirée');
    }

    // Vérifier si un compte existe déjà pour cet email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });
    if (existingUser) throw new BadRequestException('Un compte existe déjà pour cet email');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Transaction : créer User + lier au Patient + marquer invitation accepted
    const { user, patient } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          role: 'patient',
        },
      });

      const patient = await tx.patient.update({
        where: { id: invitation.patientId },
        data: { userId: user.id },
      });

      await tx.patientInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' },
      });

      // Consentements RGPD initiaux
      await tx.gdprConsent.createMany({
        data: [
          {
            patientId: invitation.patientId,
            type: 'portal_access',
            version: '1.0',
          },
          {
            patientId: invitation.patientId,
            type: 'data_processing',
            version: '1.0',
          },
          {
            patientId: invitation.patientId,
            type: 'ai_processing',
            version: '1.0',
          },
        ],
      });

      return { user, patient };
    });

    this.logger.log(`Patient ${patient.id} a accepté l'invitation`);

    const psyEmail = invitation.psychologist.user.email;
    await this.emailService.sendInvitationAccepted(psyEmail, {
      patientName: invitation.patient.name,
      psychologistName: invitation.psychologist.name,
    });

    return this.generateTokens(user.id, patient.id, user.email);
  }

  /**
   * Login patient par email/password
   */
  async login(dto: PatientLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { patient: { select: { id: true } } },
    });

    if (!user || user.role !== 'patient' || !user.passwordHash) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    if (!user.patient) throw new UnauthorizedException('Compte patient non associé');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSignInAt: new Date() },
    });

    return this.generateTokens(user.id, user.patient.id, user.email);
  }

  /**
   * Valide un token d'invitation (pour la page d'acceptation)
   */
  async validateInvitationToken(token: string) {
    const invitation = await this.prisma.patientInvitation.findUnique({
      where: { token },
      include: {
        patient: { select: { name: true } },
        psychologist: { select: { name: true } },
      },
    });

    if (!invitation) throw new NotFoundException('Invitation introuvable');
    if (invitation.status !== 'pending') throw new BadRequestException('Invitation déjà utilisée');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation expirée');

    return {
      email: invitation.email,
      patientName: invitation.patient.name,
      psychologistName: invitation.psychologist.name,
    };
  }

  private generateTokens(userId: string, patientId: string, email: string) {
    const payload = { sub: userId, patientId, email };
    const secret = this.config.getOrThrow<string>('PATIENT_JWT_SECRET');

    const accessToken = this.jwt.sign(payload, {
      secret,
      expiresIn: '1h',
      algorithm: 'HS256',
    });

    const refreshToken = this.jwt.sign(
      { sub: userId, patientId, type: 'refresh' },
      {
        secret,
        expiresIn: '7d',
        algorithm: 'HS256',
      },
    );

    return { accessToken, refreshToken, userId, patientId, email };
  }

  /**
   * Rafraîchit le token patient via refresh token
   */
  async refreshToken(refreshTokenValue: string) {
    const secret = this.config.getOrThrow<string>('PATIENT_JWT_SECRET');

    try {
      const decoded = this.jwt.verify(refreshTokenValue, { secret }) as {
        sub: string;
        patientId: string;
        type?: string;
      };

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Token invalide');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, email: true, role: true },
      });

      if (!user || user.role !== 'patient') {
        throw new UnauthorizedException('Compte introuvable');
      }

      return this.generateTokens(user.id, decoded.patientId, user.email);
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }
}
