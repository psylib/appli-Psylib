import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessagingService } from './messaging.service';

// Tests sécu/HDS du module messagerie chiffrée (audit #10 — module sans tests) :
//  - contenu chiffré AES-256-GCM AVANT persistance
//  - audit DECRYPT/CREATE obligatoire
//  - isolation tenant (patient ↔ psy) + contrôle d'accès membre de conversation
//  - tolérance au déchiffrement corrompu

function buildService(overrides: Record<string, any> = {}) {
  const prisma: any = {
    psychologist: { findUnique: vi.fn().mockResolvedValue({ id: 'psy1', userId: 'psyUser' }) },
    patient: { findFirst: vi.fn().mockResolvedValue({ id: 'pat1', psychologistId: 'psy1', userId: 'patUser' }) },
    conversation: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    },
    message: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      groupBy: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    ...overrides.prisma,
  };

  const encryption = {
    encrypt: vi.fn().mockImplementation((v: string) => `ENC(${v})`),
    decrypt: vi.fn().mockImplementation((v: string) => v.replace(/^ENC\(/, '').replace(/\)$/, '')),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined), logRead: vi.fn().mockResolvedValue(undefined), logDecrypt: vi.fn().mockResolvedValue(undefined) };

  const service = new MessagingService(prisma as any, encryption as any, audit as any);
  return { service, prisma, encryption, audit };
}

// Conversation dont psyUser et patUser sont membres
function memberConversation() {
  return {
    id: 'conv1',
    psychologistId: 'psy1',
    patientId: 'pat1',
    createdAt: new Date(),
    psychologist: { userId: 'psyUser' },
    patient: { userId: 'patUser' },
  };
}

describe('MessagingService.sendMessage', () => {
  it('chiffre le contenu AVANT persistance et le renvoie en clair', async () => {
    const { service, prisma, encryption } = buildService();
    prisma.conversation.findUnique.mockResolvedValue(memberConversation());
    prisma.message.create.mockResolvedValue({
      id: 'm1', conversationId: 'conv1', senderId: 'psyUser', content: 'ENC(hello)', readAt: null, createdAt: new Date(),
    });

    const result = await service.sendMessage('conv1', 'psyUser', 'hello');

    expect(encryption.encrypt).toHaveBeenCalledWith('hello');
    // ce qui est persisté est le ciphertext, jamais le clair
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ content: 'ENC(hello)' }) }),
    );
    expect(result.content).toBe('hello');
  });

  it('émet un audit CREATE sur le message', async () => {
    const { service, prisma, audit } = buildService();
    prisma.conversation.findUnique.mockResolvedValue(memberConversation());
    prisma.message.create.mockResolvedValue({
      id: 'm1', conversationId: 'conv1', senderId: 'psyUser', content: 'ENC(hi)', readAt: null, createdAt: new Date(),
    });

    await service.sendMessage('conv1', 'psyUser', 'hi');

    expect(audit.log.mock.calls.some((c: any[]) => c[0]?.action === 'CREATE' && c[0]?.entityType === 'message')).toBe(true);
  });

  it('refuse un utilisateur non-membre de la conversation', async () => {
    const { service, prisma } = buildService();
    prisma.conversation.findUnique.mockResolvedValue(memberConversation());

    await expect(service.sendMessage('conv1', 'intruder', 'leak')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });
});

describe('MessagingService.getMessages', () => {
  it('déchiffre les messages et émet un audit DECRYPT', async () => {
    const { service, prisma, audit, encryption } = buildService();
    prisma.conversation.findUnique.mockResolvedValue(memberConversation());
    prisma.message.findMany.mockResolvedValue([
      { id: 'm1', conversationId: 'conv1', senderId: 'patUser', content: 'ENC(secret)', readAt: null, createdAt: new Date() },
    ]);

    const result = await service.getMessages('conv1', 'psyUser');

    expect(encryption.decrypt).toHaveBeenCalledWith('ENC(secret)');
    expect(result[0]?.content).toBe('secret');
    expect(audit.log.mock.calls.some((c: any[]) => c[0]?.action === 'DECRYPT' && c[0]?.entityType === 'message')).toBe(true);
  });

  it('refuse un non-membre', async () => {
    const { service, prisma } = buildService();
    prisma.conversation.findUnique.mockResolvedValue(memberConversation());

    await expect(service.getMessages('conv1', 'intruder')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lève NotFound si la conversation n\'existe pas', async () => {
    const { service, prisma } = buildService();
    prisma.conversation.findUnique.mockResolvedValue(null);

    await expect(service.getMessages('ghost', 'psyUser')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('renvoie un marqueur lisible si le déchiffrement échoue (pas de crash)', async () => {
    const { service, prisma, encryption } = buildService();
    prisma.conversation.findUnique.mockResolvedValue(memberConversation());
    prisma.message.findMany.mockResolvedValue([
      { id: 'm1', conversationId: 'conv1', senderId: 'patUser', content: 'CORRUPT', readAt: null, createdAt: new Date() },
    ]);
    encryption.decrypt.mockImplementation(() => { throw new Error('bad tag'); });

    const result = await service.getMessages('conv1', 'psyUser');
    expect(result[0]?.content).toBe('[contenu illisible]');
  });
});

describe('MessagingService.getOrCreateConversation (isolation tenant)', () => {
  it('refuse un patient n\'appartenant pas au psychologue', async () => {
    const { service, prisma } = buildService();
    prisma.patient.findFirst.mockResolvedValue(null); // patient d'un autre tenant

    await expect(service.getOrCreateConversation('psyUser', 'patX')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('réutilise une conversation existante au lieu d\'en créer une', async () => {
    const { service, prisma } = buildService();
    const existing = memberConversation();
    prisma.conversation.findUnique.mockResolvedValue(existing);

    const result = await service.getOrCreateConversation('psyUser', 'pat1');

    expect(result).toBe(existing);
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('crée une conversation liée au profil psy (pas au userId)', async () => {
    const { service, prisma } = buildService();
    prisma.conversation.findUnique.mockResolvedValue(null);
    prisma.conversation.create.mockResolvedValue({ id: 'conv2', psychologistId: 'psy1', patientId: 'pat1', createdAt: new Date() });

    await service.getOrCreateConversation('psyUser', 'pat1');

    expect(prisma.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { psychologistId: 'psy1', patientId: 'pat1' } }),
    );
  });
});

describe('MessagingService.markRead', () => {
  it('ne marque lus que les messages de l\'autre partie', async () => {
    const { service, prisma } = buildService();
    prisma.conversation.findUnique.mockResolvedValue(memberConversation());

    await service.markRead('conv1', 'psyUser');

    expect(prisma.message.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ conversationId: 'conv1', senderId: { not: 'psyUser' }, readAt: null }),
      }),
    );
  });
});
