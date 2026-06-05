import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import { SubscriptionService } from '../billing/subscription.service';
import { EmailService } from '../notifications/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../common/storage.service';
import { ShareDocumentDto } from './dto/share-document.dto';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { Request } from 'express';

/**
 * Detect MIME type from file magic bytes (first few bytes).
 * Returns null if the signature is not recognized.
 */
function detectMimeFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  // PDF: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  // ZIP-based (DOCX, ODT): PK\x03\x04
  if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
    // DOCX and ODT are both ZIP-based — accept as valid
    return null; // Can't distinguish DOCX from ODT from ZIP header alone; trust declared type
  }
  // Unknown signature — could be malicious
  return 'application/octet-stream';
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly subscriptionService: SubscriptionService,
    private readonly emailService: EmailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {}

  async share(
    userId: string,
    dto: ShareDocumentDto,
    file: Express.Multer.File,
    req?: Request,
  ) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, psychologistId: psy.id },
      select: { id: true, name: true, email: true, userId: true },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Type de fichier non autorisé. Types acceptés : PDF, JPEG, PNG, DOCX, ODT.');
    }
    // Validate actual file content via magic bytes (not just client-declared MIME)
    const detectedMime = detectMimeFromMagicBytes(file.buffer);
    if (detectedMime === 'application/octet-stream') {
      throw new BadRequestException('Le contenu du fichier ne correspond pas au type déclaré.');
    }
    if (detectedMime && !ALLOWED_MIME_TYPES.includes(detectedMime)) {
      throw new BadRequestException('Le contenu du fichier ne correspond pas au type déclaré.');
    }
    if (detectedMime === null) {
      // ZIP-based file (DOCX, ODT) — validate declared MIME is an allowed ZIP-based type
      const ZIP_BASED_MIME_TYPES = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.oasis.opendocument.text',
      ];
      const isZip = file.buffer.length >= 4
        && file.buffer[0] === 0x50 && file.buffer[1] === 0x4B
        && file.buffer[2] === 0x03 && file.buffer[3] === 0x04;
      if (isZip && !ZIP_BASED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException('Type de fichier ZIP non autorisé. Seuls les fichiers DOCX et ODT sont acceptés.');
      }
      if (!isZip && file.buffer.length >= 4) {
        throw new BadRequestException('Le contenu du fichier ne correspond pas au type déclaré.');
      }
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Fichier trop volumineux (max 10 Mo).');
    }

    await this.subscriptionService.checkDocumentQuota(psy.id, file.size);

    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileId = randomUUID();
    const storageKey = `${psy.id}/${dto.patientId}/${fileId}_${safeName}`;

    const filePath = await this.storage.upload(storageKey, file.buffer, file.mimetype);

    const encryptedMessage = dto.message
      ? this.encryption.encrypt(dto.message)
      : null;

    const doc = await this.prisma.sharedDocument.create({
      data: {
        psychologistId: psy.id,
        patientId: dto.patientId,
        fileName: file.originalname.replace(/[\r\n\x00-\x1F]/g, '').slice(0, 255),
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        category: dto.category,
        message: encryptedMessage,
      },
    });

    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'document',
      entityId: doc.id,
      metadata: { patientId: dto.patientId, fileName: file.originalname },
      req,
    });

    // Email notification (skip gracefully if no email)
    if (patient.email) {
      const portalUrl = `${this.config.get('FRONTEND_URL') ?? 'https://app.psylib.eu'}/patient-portal/documents`;
      await this.emailService.sendDocumentShared(patient.email, {
        psychologistName: psy.name,
        documentName: file.originalname,
        category: dto.category,
        message: dto.message,
        portalUrl,
      }).catch((err) => {
        this.logger.warn(`Failed to send document notification email: ${(err as Error).message}`);
      });
    }

    // In-app notification (if patient has a user account)
    if (patient.userId) {
      await this.notifications.createAndDispatch(
        patient.userId,
        'document_shared',
        'Nouveau document',
        `${psy.name} vous a partagé un document : ${file.originalname}`,
        { documentId: doc.id },
      ).catch((err) => {
        this.logger.warn(`Failed to send document notification: ${(err as Error).message}`);
      });
    }

    return {
      id: doc.id,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      category: doc.category,
      message: dto.message ?? null,
      createdAt: doc.createdAt,
    };
  }

  async findAll(userId: string, patientId?: string, page = 1, limit = 20) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const where = {
      psychologistId: psy.id,
      deletedAt: null,
      ...(patientId ? { patientId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.sharedDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          category: true,
          message: true,
          downloadedAt: true,
          createdAt: true,
          patient: { select: { id: true, name: true } },
        },
      }),
      this.prisma.sharedDocument.count({ where }),
    ]);

    return {
      data: data.map((d) => ({
        ...d,
        message: this.safeDecrypt(d.message),
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(userId: string, docId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const doc = await this.prisma.sharedDocument.findFirst({
      where: { id: docId, psychologistId: psy.id, deletedAt: null },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        category: true,
        message: true,
        downloadedAt: true,
        createdAt: true,
        patient: { select: { id: true, name: true } },
      },
    });
    if (!doc) throw new NotFoundException('Document introuvable');

    return {
      ...doc,
      message: this.safeDecrypt(doc.message),
    };
  }

  async softDelete(userId: string, docId: string, req?: Request) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const doc = await this.prisma.sharedDocument.findFirst({
      where: { id: docId, psychologistId: psy.id, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Document introuvable');

    await this.storage.delete(doc.filePath).catch(() => {
      this.logger.warn(`Physical file not found for document ${docId}: ${doc.filePath}`);
    });

    await this.prisma.sharedDocument.update({
      where: { id: docId },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'DELETE',
      entityType: 'document',
      entityId: docId,
      req,
    });

    return { deleted: true };
  }

  async purgePatientDocuments(psychologistId: string, patientId: string): Promise<void> {
    const docs = await this.prisma.sharedDocument.findMany({
      where: { psychologistId, patientId },
      select: { id: true, filePath: true },
    });

    for (const doc of docs) {
      await this.storage.delete(doc.filePath).catch(() => {
        this.logger.warn(`RGPD purge: file not found ${doc.filePath}`);
      });
    }

    await this.prisma.sharedDocument.deleteMany({
      where: { psychologistId, patientId },
    });

    this.logger.log(`[RGPD] Purged ${docs.length} documents for patient ${patientId}`);
  }

  async downloadForPsy(userId: string, docId: string, req?: Request) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const doc = await this.prisma.sharedDocument.findFirst({
      where: { id: docId, psychologistId: psy.id, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Document introuvable');

    const buffer = await this.storage.download(doc.filePath);

    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'READ',
      entityType: 'document',
      entityId: docId,
      req,
    });

    return { buffer, fileName: doc.fileName, mimeType: doc.mimeType };
  }

  private safeDecrypt(value: string | null): string | null {
    if (!value) return null;
    try {
      return this.encryption.decrypt(value);
    } catch (err) {
      this.logger.warn(`Failed to decrypt document message: ${err}`);
      return null;
    }
  }
}
