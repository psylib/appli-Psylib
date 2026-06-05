import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VideoService } from './video.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildService(overrides: {
  consent?: unknown;
  appointment?: unknown;
  room?: unknown;
} = {}) {
  const prisma = {
    psychologist: {
      findUnique: vi.fn().mockResolvedValue({ id: 'psy1', userId: 'user1' }),
    },
    videoRoom: {
      findFirst: vi.fn().mockResolvedValue(
        overrides.room ?? { id: 'room1', status: 'active', scribeEnabled: true },
      ),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({}),
    },
    appointment: {
      findUnique: vi.fn().mockResolvedValue(
        'appointment' in overrides ? overrides.appointment : { patientId: 'pat1' },
      ),
    },
    gdprConsent: {
      findFirst: vi.fn().mockResolvedValue(
        'consent' in overrides ? overrides.consent : { id: 'consent1' },
      ),
    },
  };

  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  const scribeQueue = { add: vi.fn().mockResolvedValue({}) };
  const config = { get: vi.fn().mockReturnValue('') };

  const service = new VideoService(
    prisma as any,
    audit as any,
    undefined as any, // roomService — not used in scribe upload
    config as any,
    undefined as any, // notificationGateway — not used here
    scribeQueue as any,
  );

  return { service, prisma, audit, scribeQueue };
}

const AUDIO = Buffer.from('fake-audio-bytes');

// ─── AI Scribe consent enforcement (HDS / RGPD règle absolue #3) ─────────────

describe('VideoService.uploadScribeAudio — consentement IA', () => {
  let env: ReturnType<typeof buildService>;

  beforeEach(() => {
    env = buildService();
  });

  it('refuse (Forbidden) si le patient n\'a pas consenti à ai_video_transcription', async () => {
    const { service, scribeQueue } = buildService({ consent: null });

    await expect(
      service.uploadScribeAudio('user1', 'appt1', AUDIO),
    ).rejects.toThrow(ForbiddenException);

    // L'audio ne doit JAMAIS être mis en file vers les LLM sans consentement
    expect(scribeQueue.add).not.toHaveBeenCalled();
  });

  it('refuse (Forbidden) pour une visio instantanée sans patient identifié', async () => {
    const { service, scribeQueue } = buildService({ appointment: { patientId: null } });

    await expect(
      service.uploadScribeAudio('user1', 'appt1', AUDIO),
    ).rejects.toThrow(ForbiddenException);
    expect(scribeQueue.add).not.toHaveBeenCalled();
  });

  it('enfile le job quand le consentement ai_video_transcription est présent', async () => {
    const { service, scribeQueue } = buildService(); // consent présent par défaut

    const result = await service.uploadScribeAudio('user1', 'appt1', AUDIO);

    expect(result).toEqual({ status: 'processing' });
    expect(scribeQueue.add).toHaveBeenCalledTimes(1);
  });

  it('ne flippe pas le statut en processing si le consentement manque', async () => {
    const { service, prisma } = buildService({ consent: null });

    await expect(
      service.uploadScribeAudio('user1', 'appt1', AUDIO),
    ).rejects.toThrow(ForbiddenException);

    // Le check de consentement doit précéder l'atomic check-and-set du statut
    expect(prisma.videoRoom.updateMany).not.toHaveBeenCalled();
  });
});
