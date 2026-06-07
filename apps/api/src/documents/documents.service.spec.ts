import { vi, describe, it, expect } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentsService } from './documents.service';

// Tests sécu/HDS du partage de documents (audit #10 — module sans tests, path traversal audit #5) :
//  - isolation tenant (patient ↔ psy)
//  - allow-list MIME + validation magic-bytes (contenu réel vs type déclaré)
//  - neutralisation du path traversal dans le nom de fichier → clé de stockage
//  - chiffrement du message avant persistance

const PDF_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
const GARBAGE_BYTES = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]); // signature inconnue

function buildService(overrides: Record<string, any> = {}) {
  const prisma: any = {
    psychologist: { findUnique: vi.fn().mockResolvedValue({ id: 'psy1', name: 'Dr X', userId: 'psyUser' }) },
    patient: { findFirst: vi.fn().mockResolvedValue({ id: 'pat1', name: 'P', email: null, userId: null }) },
    sharedDocument: {
      create: vi.fn().mockResolvedValue({ id: 'doc1', fileName: 'f.pdf', fileSize: 8, mimeType: 'application/pdf', category: 'report', createdAt: new Date() }),
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    ...overrides.prisma,
  };
  const encryption = {
    encrypt: vi.fn().mockImplementation((v: string) => `ENC(${v})`),
    decrypt: vi.fn().mockImplementation((v: string) => `PLAIN(${v})`),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  const subscriptionService = { checkDocumentQuota: vi.fn().mockResolvedValue(undefined) };
  const emailService = { sendDocumentShared: vi.fn().mockResolvedValue(undefined) };
  const notifications = { createAndDispatch: vi.fn().mockResolvedValue(undefined) };
  const config = { get: vi.fn().mockReturnValue('https://app.psylib.eu') };
  const storage = { upload: vi.fn().mockResolvedValue('psy1/pat1/key'), download: vi.fn(), delete: vi.fn().mockResolvedValue(undefined) };

  const service = new DocumentsService(
    prisma as any, encryption as any, audit as any, subscriptionService as any,
    emailService as any, notifications as any, config as any, storage as any,
  );
  return { service, prisma, encryption, audit, storage };
}

function file(partial: Partial<Express.Multer.File>): Express.Multer.File {
  return {
    originalname: 'doc.pdf', mimetype: 'application/pdf', size: 8, buffer: PDF_BYTES,
    fieldname: 'file', encoding: '7bit', stream: undefined as any, destination: '', filename: '', path: '',
    ...partial,
  } as Express.Multer.File;
}

describe('DocumentsService.share', () => {
  const dto = { patientId: 'pat1', category: 'report' as any, message: undefined };

  it('refuse un patient d\'un autre tenant', async () => {
    const { service, prisma } = buildService();
    prisma.patient.findFirst.mockResolvedValue(null);

    await expect(service.share('psyUser', dto as any, file({}))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejette un type MIME non autorisé', async () => {
    const { service } = buildService();
    await expect(
      service.share('psyUser', dto as any, file({ mimetype: 'application/x-msdownload' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejette un contenu dont les magic-bytes ne correspondent pas (signature inconnue)', async () => {
    const { service, storage } = buildService();
    await expect(
      service.share('psyUser', dto as any, file({ mimetype: 'application/pdf', buffer: GARBAGE_BYTES, size: 6 })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('neutralise le path traversal du nom de fichier dans la clé de stockage', async () => {
    const { service, storage } = buildService();

    await service.share('psyUser', dto as any, file({ originalname: '../../../etc/passwd.pdf' }));

    const key = storage.upload.mock.calls[0][0] as string;
    expect(key.startsWith('psy1/pat1/')).toBe(true);
    expect(key).not.toContain('..');
    expect(key).not.toContain('/etc/');
  });

  it('chiffre le message avant persistance', async () => {
    const { service, prisma, encryption } = buildService();

    await service.share('psyUser', { ...dto, message: 'note confidentielle' } as any, file({}));

    expect(encryption.encrypt).toHaveBeenCalledWith('note confidentielle');
    expect(prisma.sharedDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ message: 'ENC(note confidentielle)' }) }),
    );
  });

  it('émet un audit CREATE sur le document', async () => {
    const { service, audit } = buildService();
    await service.share('psyUser', dto as any, file({}));
    expect(audit.log.mock.calls.some((c: any[]) => c[0]?.action === 'CREATE' && c[0]?.entityType === 'document')).toBe(true);
  });
});

describe('DocumentsService.findOne (isolation tenant)', () => {
  it('filtre par psychologistId et lève NotFound si absent', async () => {
    const { service, prisma } = buildService();
    prisma.sharedDocument.findFirst.mockResolvedValue(null);

    await expect(service.findOne('psyUser', 'docX')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.sharedDocument.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'docX', psychologistId: 'psy1', deletedAt: null }) }),
    );
  });
});

describe('DocumentsService.downloadForPsy', () => {
  it('audite un READ et ne sert que les documents du tenant', async () => {
    const { service, prisma, audit, storage } = buildService();
    prisma.sharedDocument.findFirst.mockResolvedValue({ id: 'doc1', filePath: 'psy1/pat1/k', fileName: 'f.pdf', mimeType: 'application/pdf' });
    storage.download.mockResolvedValue(Buffer.from('data'));

    const res = await service.downloadForPsy('psyUser', 'doc1');

    expect(res.fileName).toBe('f.pdf');
    expect(audit.log.mock.calls.some((c: any[]) => c[0]?.action === 'READ' && c[0]?.entityType === 'document')).toBe(true);
  });
});
