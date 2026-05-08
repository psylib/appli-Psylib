import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { EmailService } from '../notifications/email.service';
import { NotificationGateway } from '../notifications/notification.gateway';

@Injectable()
export class GuardianConsentsService {
  private readonly logger = new Logger(GuardianConsentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationGateway,
  ) {}

  async requestConsent(
    psychologistId: string,
    patientId: string,
    guardianId: string,
    consentType: string,
    actorUserId: string,
  ) {
    const validTypes = ['data_processing', 'ai_processing', 'video_consultation'];
    if (!validTypes.includes(consentType)) {
      throw new BadRequestException(`Type de consentement invalide: ${consentType}`);
    }

    const guardian = await this.prisma.legalGuardian.findFirst({
      where: { id: guardianId, patientId, psychologistId },
      include: { patient: { select: { name: true } } },
    });
    if (!guardian) throw new NotFoundException('Tuteur introuvable');

    const secret = this.config.getOrThrow<string>('PATIENT_JWT_SECRET');
    const requestId = crypto.randomUUID();
    const payload = `${guardianId}:${patientId}:${consentType}:${requestId}`;
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = `${requestId}.${hmac}`;

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const request = await this.prisma.guardianConsentRequest.create({
      data: { psychologistId, guardianId, patientId, consentType, token, expiresAt },
    });

    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      select: { name: true },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const consentUrl = `${frontendUrl}/guardian-consent/${token}`;

    await this.email.sendGuardianConsentRequest(guardian.email, {
      guardianName: guardian.name,
      patientFirstName: guardian.patient.name.split(' ')[0] ?? guardian.patient.name,
      psychologistName: psy?.name ?? 'Votre psychologue',
      consentType,
      consentUrl,
    });

    await this.audit.log({
      actorId: actorUserId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'guardian_consent_request',
      entityId: request.id,
      metadata: { guardianId, patientId, consentType },
    });

    return { sent: true, expiresAt };
  }

  async getConsentPage(token: string) {
    const request = await this.prisma.guardianConsentRequest.findUnique({
      where: { token },
      include: {
        guardian: { select: { name: true } },
        patient: { select: { name: true } },
        psychologist: { select: { name: true } },
      },
    });

    if (!request) throw new NotFoundException('Demande de consentement introuvable');
    if (request.status !== 'pending') throw new BadRequestException('Ce consentement a deja ete traite');
    if (request.expiresAt < new Date()) throw new BadRequestException('Ce lien a expire');

    return {
      guardianName: request.guardian.name,
      patientFirstName: request.patient.name.split(' ')[0] ?? request.patient.name,
      psychologistName: request.psychologist.name,
      consentType: request.consentType,
      status: request.status,
    };
  }

  async approveConsent(token: string, ipAddress: string) {
    const request = await this.prisma.guardianConsentRequest.findUnique({
      where: { token },
      include: {
        guardian: { select: { name: true, email: true } },
        patient: { select: { name: true } },
        psychologist: { select: { name: true, userId: true, user: { select: { email: true } } } },
      },
    });

    if (!request) throw new NotFoundException('Demande introuvable');
    if (request.status !== 'pending') throw new BadRequestException('Deja traite');
    if (request.expiresAt < new Date()) throw new BadRequestException('Expire');

    await this.prisma.$transaction([
      this.prisma.guardianConsentRequest.update({
        where: { id: request.id },
        data: { status: 'approved', respondedAt: new Date(), ipAddress },
      }),
      this.prisma.gdprConsent.create({
        data: {
          patientId: request.patientId,
          type: request.consentType,
          version: '1.0',
          consentGivenBy: 'guardian',
          guardianId: request.guardianId,
          ipAddress,
        },
      }),
    ]);

    // Notify psy via WebSocket
    try {
      this.notifications.sendToUser(request.psychologist.userId, {
        type: 'guardian:consent_approved',
        title: 'Consentement approuve',
        body: `${request.guardian.name} a approuve le consentement "${request.consentType}" pour ${request.patient.name}`,
        data: { patientId: request.patientId, consentType: request.consentType },
      });
    } catch {
      /* ignore notification errors */
    }

    // Send confirmation emails
    await this.email.sendGuardianConsentConfirmed(
      request.guardian.email,
      request.psychologist.user.email,
      {
        guardianName: request.guardian.name,
        patientFirstName: request.patient.name.split(' ')[0] ?? request.patient.name,
        consentType: request.consentType,
      },
    );

    return { approved: true };
  }

  async refuseConsent(token: string, ipAddress: string) {
    const request = await this.prisma.guardianConsentRequest.findUnique({
      where: { token },
      include: {
        guardian: { select: { name: true } },
        patient: { select: { name: true } },
        psychologist: { select: { userId: true } },
      },
    });

    if (!request) throw new NotFoundException('Demande introuvable');
    if (request.status !== 'pending') throw new BadRequestException('Deja traite');

    await this.prisma.guardianConsentRequest.update({
      where: { id: request.id },
      data: { status: 'refused', respondedAt: new Date(), ipAddress },
    });

    try {
      this.notifications.sendToUser(request.psychologist.userId, {
        type: 'guardian:consent_refused',
        title: 'Consentement refuse',
        body: `${request.guardian.name} a refuse le consentement "${request.consentType}" pour ${request.patient.name}`,
        data: { patientId: request.patientId, consentType: request.consentType },
      });
    } catch {
      /* ignore notification errors */
    }

    return { refused: true };
  }
}
