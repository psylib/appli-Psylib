import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { EmailService } from '../notifications/email.service';
import * as crypto from 'crypto';

@Injectable()
export class PatientInvitationService {
  private readonly logger = new Logger(PatientInvitationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Envoie une invitation portal à un patient (côté psychologue)
   */
  async invitePatient(psychologistUserId: string, patientId: string) {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId: psychologistUserId },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');
    if (!patient.email) throw new BadRequestException('Ce patient n\'a pas d\'email enregistré');

    // Annuler toute invitation pending existante
    await this.prisma.patientInvitation.updateMany({
      where: { patientId, status: 'pending' },
      data: { status: 'expired' },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const invitation = await this.prisma.patientInvitation.create({
      data: {
        psychologistId: psy.id,
        patientId,
        email: patient.email,
        token,
        expiresAt,
      },
    });

    await this.audit.log({
      actorId: psychologistUserId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'patient_invitation',
      entityId: invitation.id,
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const invitationUrl = `${frontendUrl}/patient/accept-invitation?token=${token}`;

    this.logger.log(`Invitation créée pour ${patient.email}: ${invitationUrl}`);

    await this.emailService.sendPatientInvitation(patient.email, {
      patientName: patient.name,
      psychologistName: psy.name,
      invitationUrl,
      expiresAt,
    });

    return {
      id: invitation.id,
      email: patient.email,
      expiresAt,
      invitationUrl,
    };
  }

  /**
   * Statut d'invitation d'un patient
   */
  async getInvitationStatus(psychologistUserId: string, patientId: string) {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId: psychologistUserId },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
      include: {
        user: { select: { lastSignInAt: true } },
        invitations: {
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    const hasPortalAccess = !!patient.userId;
    const lastInvitation = patient.invitations[0] ?? null;

    return {
      hasPortalAccess,
      lastSignIn: patient.user?.lastSignInAt ?? null,
      invitation: lastInvitation
        ? {
            status: lastInvitation.status,
            email: lastInvitation.email,
            expiresAt: lastInvitation.expiresAt,
          }
        : null,
    };
  }
}
