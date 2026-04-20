import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { VideoService } from '../video.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrisma = {
  psychologist: { findUnique: vi.fn() },
  appointment: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  appointmentParticipant: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  videoRoom: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  gdprConsent: { findFirst: vi.fn(), create: vi.fn() },
  session: { create: vi.fn() },
};

const mockAudit = { log: vi.fn() };

const mockLivekitRoomService = {
  createRoom: vi.fn(),
  deleteRoom: vi.fn(),
  listParticipants: vi.fn(),
};

const mockConfig = {
  get: vi.fn((key: string, defaultValue?: string) => {
    const map: Record<string, string> = {
      LIVEKIT_API_KEY: 'test-api-key',
      LIVEKIT_API_SECRET: 'test-api-secret-that-is-long-enough-for-hs256-algorithm',
      LIVEKIT_WS_URL: 'wss://livekit.test.local',
    };
    return map[key] ?? defaultValue ?? '';
  }),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PATIENT_ID = 'patient-1';
const PARTICIPANT_ID = 'patient-participant-1';
const APPOINTMENT_ID = 'appt-1';
const ROOM_ID = 'room-1';

function makeVideoRoom(overrides = {}) {
  return {
    id: ROOM_ID,
    appointmentId: APPOINTMENT_ID,
    psychologistId: 'psy-1',
    roomName: `psylib-${APPOINTMENT_ID}`,
    status: 'active',
    psyJoinedAt: new Date(),
    patientJoinedAt: null,
    endedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Service factory ──────────────────────────────────────────────────────────
function createService(): VideoService {
  return new VideoService(
    mockPrisma as never,
    mockAudit as never,
    mockLivekitRoomService as never,
    mockConfig as never,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('VideoService — Multi-participant', () => {
  let service: VideoService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  describe('generatePatientToken() — participant token lookup', () => {
    it('should find participant by their token when primary lookup returns null', async () => {
      const room = makeVideoRoom();

      // Primary appointment lookup misses
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);

      // Secondary participant lookup succeeds
      mockPrisma.appointmentParticipant.findFirst.mockResolvedValueOnce({
        id: 'ap-1',
        patientId: PARTICIPANT_ID,
        videoJoinToken: 'participant-join-token',
        patient: { id: PARTICIPANT_ID, name: 'Participant User' },
        appointment: {
          id: APPOINTMENT_ID,
          patientId: PATIENT_ID,
          duration: 50,
          videoRoom: room,
          psychologist: { name: 'Dr. Test' },
        },
      });

      // Has GDPR consent
      mockPrisma.gdprConsent.findFirst.mockResolvedValueOnce({ id: 'consent-1' });

      // Mark participant joined
      mockPrisma.videoRoom.update.mockResolvedValueOnce({ ...room, patientJoinedAt: new Date() });
      mockPrisma.appointmentParticipant.updateMany.mockResolvedValueOnce({ count: 1 });

      const result = await service.generatePatientToken('participant-join-token');

      expect(result).toHaveProperty('token');
      expect(result.token).toBeTruthy();
      expect(result.wsUrl).toBe('wss://livekit.test.local');
      expect(result.roomName).toBe(`psylib-${APPOINTMENT_ID}`);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: PARTICIPANT_ID,
          actorType: 'patient',
          action: 'VIDEO_PATIENT_JOIN',
        }),
      );
    });

    it('should throw UnauthorizedException for invalid token (both lookups fail)', async () => {
      // Primary lookup misses
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);
      // Participant lookup also misses
      mockPrisma.appointmentParticipant.findFirst.mockResolvedValueOnce(null);

      await expect(service.generatePatientToken('totally-invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return needsConsent when participant has no GDPR consent', async () => {
      const room = makeVideoRoom();

      // Primary lookup misses
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);

      // Participant found
      mockPrisma.appointmentParticipant.findFirst.mockResolvedValueOnce({
        id: 'ap-1',
        patientId: PARTICIPANT_ID,
        videoJoinToken: 'participant-join-token',
        patient: { id: PARTICIPANT_ID, name: 'Participant User' },
        appointment: {
          id: APPOINTMENT_ID,
          patientId: PATIENT_ID,
          duration: 50,
          videoRoom: room,
          psychologist: { name: 'Dr. Test' },
        },
      });

      // No GDPR consent
      mockPrisma.gdprConsent.findFirst.mockResolvedValueOnce(null);

      const result = await service.generatePatientToken('participant-join-token');

      expect(result.needsConsent).toBe(true);
      expect(result.token).toBe('');
      // Should NOT have joined or generated audit
      expect(mockAudit.log).not.toHaveBeenCalled();
    });
  });

  describe('recordConsent() — participant token', () => {
    it('should record consent for participant when primary lookup misses', async () => {
      // Primary appointment lookup misses
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);

      // Participant found
      mockPrisma.appointmentParticipant.findFirst.mockResolvedValueOnce({
        id: 'ap-1',
        patientId: PARTICIPANT_ID,
        videoJoinToken: 'participant-join-token',
      });

      mockPrisma.gdprConsent.create.mockResolvedValueOnce({ id: 'new-consent' });

      await service.recordConsent('participant-join-token', '192.168.1.1');

      expect(mockPrisma.gdprConsent.create).toHaveBeenCalledWith({
        data: {
          patientId: PARTICIPANT_ID,
          type: 'video_consultation',
          version: '2026-04-v1',
          ipAddress: '192.168.1.1',
        },
      });
    });

    it('should record consent for primary patient', async () => {
      // Primary appointment found
      mockPrisma.appointment.findFirst.mockResolvedValueOnce({
        id: APPOINTMENT_ID,
        patientId: PATIENT_ID,
      });

      mockPrisma.gdprConsent.create.mockResolvedValueOnce({ id: 'new-consent' });

      await service.recordConsent('primary-join-token', '10.0.0.1');

      expect(mockPrisma.gdprConsent.create).toHaveBeenCalledWith({
        data: {
          patientId: PATIENT_ID,
          type: 'video_consultation',
          version: '2026-04-v1',
          ipAddress: '10.0.0.1',
        },
      });
      // Should NOT have searched participants
      expect(mockPrisma.appointmentParticipant.findFirst).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);
      mockPrisma.appointmentParticipant.findFirst.mockResolvedValueOnce(null);

      await expect(service.recordConsent('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
