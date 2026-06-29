import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SessionScribeService } from './session-scribe.service';

function buildService(overrides: {
  session?: unknown;
  existingConsent?: unknown;
  updateCount?: number;
} = {}) {
  const prisma = {
    psychologist: { findUnique: vi.fn().mockResolvedValue({ id: 'psy1', userId: 'user1' }) },
    session: {
      findFirst: vi.fn().mockResolvedValue(
        'session' in overrides
          ? overrides.session
          : { id: 'sess1', patientId: 'pat1', scribeStatus: 'none' },
      ),
      updateMany: vi.fn().mockResolvedValue({ count: overrides.updateCount ?? 1 }),
    },
    gdprConsent: {
      findFirst: vi.fn().mockResolvedValue('existingConsent' in overrides ? overrides.existingConsent : null),
      create: vi.fn().mockResolvedValue({ id: 'c1' }),
    },
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  const scribeQueue = { add: vi.fn().mockResolvedValue({}) };

  const service = new SessionScribeService(prisma as any, audit as any, scribeQueue as any);
  return { service, prisma, audit, scribeQueue };
}

const AUDIO = Buffer.from('fake-audio-bytes');

describe('SessionScribeService.uploadAudio', () => {
  let env: ReturnType<typeof buildService>;
  beforeEach(() => { env = buildService(); });

  it("refuse (Forbidden) sans attestation de consentement et n'enqueue rien", async () => {
    await expect(env.service.uploadAudio('user1', 'sess1', AUDIO, false)).rejects.toThrow(ForbiddenException);
    expect(env.scribeQueue.add).not.toHaveBeenCalled();
  });

  it('refuse (NotFound) si la séance est introuvable', async () => {
    const e = buildService({ session: null });
    await expect(e.service.uploadAudio('user1', 'sess1', AUDIO, true)).rejects.toThrow(NotFoundException);
    expect(e.scribeQueue.add).not.toHaveBeenCalled();
  });

  it('refuse (BadRequest) un audio vide', async () => {
    await expect(env.service.uploadAudio('user1', 'sess1', Buffer.alloc(0), true)).rejects.toThrow(BadRequestException);
  });

  it('refuse (BadRequest) si une transcription est déjà en cours', async () => {
    const e = buildService({ updateCount: 0 });
    await expect(e.service.uploadAudio('user1', 'sess1', AUDIO, true)).rejects.toThrow(BadRequestException);
    expect(e.scribeQueue.add).not.toHaveBeenCalled();
  });

  it('happy path : trace le consentement, set processing atomiquement, enqueue le job séance', async () => {
    const res = await env.service.uploadAudio('user1', 'sess1', AUDIO, true);
    expect(res).toEqual({ status: 'processing' });

    // consentement tracé (aucun existant)
    expect(env.prisma.gdprConsent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ patientId: 'pat1', type: 'ai_audio_transcription' }),
    });

    // atomic check-and-set
    expect(env.prisma.session.updateMany).toHaveBeenCalledWith({
      where: { id: 'sess1', scribeStatus: { not: 'processing' } },
      data: { scribeStatus: 'processing' },
    });

    // job enqueue avec sessionId (PAS videoRoomId)
    expect(env.scribeQueue.add).toHaveBeenCalledWith(
      'process',
      expect.objectContaining({ sessionId: 'sess1' }),
    );
    const jobArg = env.scribeQueue.add.mock.calls[0][1];
    expect(jobArg.videoRoomId).toBeUndefined();
    expect(jobArg.audioFilePath).toBeTruthy();

    // audit
    expect(env.audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SCRIBE_AUDIO_UPLOADED', entityType: 'session' }),
    );
  });

  it('ne recrée pas un consentement déjà actif', async () => {
    const e = buildService({ existingConsent: { id: 'existing' } });
    await e.service.uploadAudio('user1', 'sess1', AUDIO, true);
    expect(e.prisma.gdprConsent.create).not.toHaveBeenCalled();
    expect(e.scribeQueue.add).toHaveBeenCalledOnce();
  });
});

describe('SessionScribeService.getStatus', () => {
  it('renvoie le statut + hasNote', async () => {
    const e = buildService();
    e.prisma.session.findFirst = vi.fn().mockResolvedValue({ scribeStatus: 'done', scribeTranscript: 'enc' });
    const res = await e.service.getStatus('user1', 'sess1');
    expect(res).toEqual({ status: 'done', hasNote: true });
  });

  it('NotFound si séance absente', async () => {
    const e = buildService();
    e.prisma.session.findFirst = vi.fn().mockResolvedValue(null);
    await expect(e.service.getStatus('user1', 'sess1')).rejects.toThrow(NotFoundException);
  });
});
