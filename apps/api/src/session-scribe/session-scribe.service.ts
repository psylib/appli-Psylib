import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { SCRIBE_QUEUE, ScribeJobData } from '../video/scribe.processor';
import * as crypto from 'crypto';
import * as path from 'path';
import * as os from 'os';
import { promises as fsPromises } from 'fs';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const AUDIO_CONSENT_TYPE = 'ai_audio_transcription';
const AUDIO_CONSENT_VERSION = '2026-06-v1';

export interface SessionScribeStatus {
  status: 'none' | 'processing' | 'done' | 'failed';
  hasNote: boolean;
}

@Injectable()
export class SessionScribeService {
  private readonly logger = new Logger(SessionScribeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @InjectQueue(SCRIBE_QUEUE) private readonly scribeQueue: Queue<ScribeJobData>,
  ) {}

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }

  /**
   * Import d'un fichier audio de séance (présentiel) → transcription + note IA.
   * HDS / RGPD règle absolue #3 : la transcription ne part vers les LLM que si
   * le praticien atteste avoir recueilli le consentement du patient. Ce
   * consentement est tracé (gdpr_consents) et l'absence d'attestation bloque
   * l'envoi côté serveur — jamais seulement côté UI.
   */
  async uploadAudio(
    userId: string,
    sessionId: string,
    audioBuffer: Buffer,
    consentConfirmed: boolean,
  ): Promise<{ status: string }> {
    const psy = await this.getPsychologist(userId);

    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, psychologistId: psy.id },
      select: { id: true, patientId: true, scribeStatus: true },
    });
    if (!session) throw new NotFoundException('Séance introuvable');

    if (!consentConfirmed) {
      throw new ForbiddenException(
        "La transcription IA nécessite l'attestation du consentement du patient. "
        + "Activez la case de consentement avant d'importer l'audio.",
      );
    }

    if (audioBuffer.length === 0) {
      throw new BadRequestException('Fichier audio vide');
    }
    if (audioBuffer.length > MAX_AUDIO_BYTES) {
      throw new BadRequestException('Fichier audio trop volumineux (max 25 MB)');
    }

    // Trace le consentement (idempotent : un seul consentement actif par patient/type)
    const existingConsent = await this.prisma.gdprConsent.findFirst({
      where: { patientId: session.patientId, type: AUDIO_CONSENT_TYPE, withdrawnAt: null },
    });
    if (!existingConsent) {
      await this.prisma.gdprConsent.create({
        data: {
          patientId: session.patientId,
          type: AUDIO_CONSENT_TYPE,
          version: AUDIO_CONSENT_VERSION,
          consentedAt: new Date(),
        },
      });
    }

    // Atomic check-and-set : empêche un double traitement concurrent.
    const updated = await this.prisma.session.updateMany({
      where: { id: session.id, scribeStatus: { not: 'processing' } },
      data: { scribeStatus: 'processing' },
    });
    if (updated.count === 0) {
      throw new BadRequestException('Une transcription est déjà en cours pour cette séance');
    }

    const fileName = `psylib-scribe-session-${session.id}-${crypto.randomUUID()}.webm`;
    const filePath = path.join(os.tmpdir(), fileName);
    await fsPromises.writeFile(filePath, audioBuffer);

    await this.scribeQueue.add('process', {
      sessionId: session.id,
      audioFilePath: filePath,
    });

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'SCRIBE_AUDIO_UPLOADED',
      entityType: 'session',
      entityId: session.id,
      metadata: { sizeBytes: audioBuffer.length, source: 'import' },
    });

    return { status: 'processing' };
  }

  async getStatus(userId: string, sessionId: string): Promise<SessionScribeStatus> {
    const psy = await this.getPsychologist(userId);
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, psychologistId: psy.id },
      select: { scribeStatus: true, scribeTranscript: true },
    });
    if (!session) throw new NotFoundException('Séance introuvable');
    return {
      status: session.scribeStatus as SessionScribeStatus['status'],
      hasNote: session.scribeTranscript != null,
    };
  }
}
