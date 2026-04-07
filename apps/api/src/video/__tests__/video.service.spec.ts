import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoService } from '../video.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrisma = {
  psychologist: { findUnique: vi.fn() },
  appointment: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  videoRoom: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  gdprConsent: { findFirst: vi.fn(), create: vi.fn() },
  session: { create: vi.fn() },
};
const mockAudit = { log: vi.fn() };
const mockLivekitRoomService = {
  createRoom: vi.fn(),
  deleteRoom: vi.fn(),
  listParticipants: vi.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PSY_USER_ID = 'user-psy-1';
const PSY_ID = 'psy-1';
const PATIENT_ID = 'patient-1';
const APPOINTMENT_ID = 'appt-1';
const ROOM_ID = 'room-1';

const mockPsychologist = { id: PSY_ID, userId: PSY_USER_ID, name: 'Dr. Test' };

function makeAppointment(overrides = {}) {
  return {
    id: APPOINTMENT_ID,
    psychologistId: PSY_ID,
    patientId: PATIENT_ID,
    scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min from now
    duration: 50,
    status: 'scheduled',
    isOnline: true,
    videoJoinToken: 'join-token-123',
    videoRoom: null,
    patient: { id: PATIENT_ID, name: 'Marie Dupont', email: 'marie@test.com' },
    psychologist: { name: 'Dr. Test' },
    ...overrides,
  };
}

function makeVideoRoom(overrides = {}) {
  return {
    id: ROOM_ID,
    appointmentId: APPOINTMENT_ID,
    psychologistId: PSY_ID,
    roomName: `psylib-${APPOINTMENT_ID}`,
    status: 'waiting',
    psyJoinedAt: null,
    patientJoinedAt: null,
    endedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function createService(): VideoService {
  return new VideoService(
    mockPrisma as never,
    mockAudit as never,
    mockLivekitRoomService as never,
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────
let service: VideoService;

beforeEach(() => {
  vi.clearAllMocks();
  // LiveKit AccessToken requires these env vars
  process.env.LIVEKIT_API_KEY = 'test-api-key';
  process.env.LIVEKIT_API_SECRET = 'test-api-secret-that-is-long-enough-for-hs256';
  process.env.LIVEKIT_WS_URL = 'wss://livekit.test.local';
  service = createService();
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('VideoService', () => {
  describe('createRoom()', () => {
    it('should create a LiveKit room and persist VideoRoom', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(makeAppointment());
      mockLivekitRoomService.createRoom.mockResolvedValueOnce({ name: `psylib-${APPOINTMENT_ID}` });
      mockPrisma.videoRoom.create.mockResolvedValueOnce(makeVideoRoom());

      const result = await service.createRoom(PSY_USER_ID, APPOINTMENT_ID);

      expect(result).toEqual(expect.objectContaining({ roomName: `psylib-${APPOINTMENT_ID}` }));
      expect(mockLivekitRoomService.createRoom).toHaveBeenCalledOnce();
      expect(mockPrisma.videoRoom.create).toHaveBeenCalledOnce();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'VIDEO_ROOM_CREATED' }));
    });

    it('should throw if appointment is not isOnline', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(makeAppointment({ isOnline: false }));

      await expect(service.createRoom(PSY_USER_ID, APPOINTMENT_ID))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw if appointment does not belong to psy', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);

      await expect(service.createRoom(PSY_USER_ID, APPOINTMENT_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw if outside the 10-min window', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      // Appointment 2 hours from now — outside the 10-min window
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(
        makeAppointment({ scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000) }),
      );

      await expect(service.createRoom(PSY_USER_ID, APPOINTMENT_ID))
        .rejects.toThrow(BadRequestException);
    });

    it('should return existing room if already created (idempotent)', async () => {
      const existingRoom = makeVideoRoom();
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(makeAppointment({ videoRoom: existingRoom }));

      const result = await service.createRoom(PSY_USER_ID, APPOINTMENT_ID);

      expect(result).toEqual(existingRoom);
      expect(mockLivekitRoomService.createRoom).not.toHaveBeenCalled();
    });
  });

  describe('generatePsyToken()', () => {
    it('should generate a LiveKit access token for the psy', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.videoRoom.findFirst.mockResolvedValueOnce(
        makeVideoRoom({ appointment: makeAppointment() }),
      );
      mockPrisma.videoRoom.update.mockResolvedValueOnce(makeVideoRoom({ psyJoinedAt: new Date() }));

      const result = await service.generatePsyToken(PSY_USER_ID, APPOINTMENT_ID);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('wsUrl');
      expect(result).toHaveProperty('roomName');
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'VIDEO_PSY_JOIN' }));
    });
  });

  describe('generatePatientToken()', () => {
    it('should generate a token for the patient via joinToken', async () => {
      const appt = makeAppointment();
      const room = makeVideoRoom();
      mockPrisma.appointment.findFirst.mockResolvedValueOnce({ ...appt, videoRoom: room });
      mockPrisma.gdprConsent.findFirst.mockResolvedValueOnce({ id: 'consent-1' }); // has consent
      mockPrisma.videoRoom.update.mockResolvedValueOnce({ ...room, patientJoinedAt: new Date() });

      const result = await service.generatePatientToken('join-token-123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('wsUrl');
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'VIDEO_PATIENT_JOIN' }));
    });

    it('should return needsConsent if no GDPR consent', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValueOnce({ ...makeAppointment(), videoRoom: makeVideoRoom() });
      mockPrisma.gdprConsent.findFirst.mockResolvedValueOnce(null); // no consent

      const result = await service.generatePatientToken('join-token-123');

      expect(result).toEqual(expect.objectContaining({ needsConsent: true }));
    });

    it('should throw if joinToken is invalid', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValueOnce(null);

      await expect(service.generatePatientToken('invalid-token'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw if room is ended', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValueOnce({
        ...makeAppointment(),
        videoRoom: makeVideoRoom({ status: 'ended' }),
      });

      await expect(service.generatePatientToken('join-token-123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('endRoom()', () => {
    it('should end the room, update appointment, create session', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      const room = makeVideoRoom({
        status: 'active',
        psyJoinedAt: new Date(Date.now() - 50 * 60 * 1000),
        appointment: makeAppointment(),
      });
      mockPrisma.videoRoom.findFirst.mockResolvedValueOnce(room);
      mockLivekitRoomService.deleteRoom.mockResolvedValueOnce(undefined);
      mockPrisma.videoRoom.update.mockResolvedValueOnce({ ...room, status: 'ended', endedAt: new Date() });
      mockPrisma.appointment.update.mockResolvedValueOnce({ ...makeAppointment(), status: 'completed' });
      mockPrisma.session.create.mockResolvedValueOnce({ id: 'session-1' });

      await service.endRoom(PSY_USER_ID, APPOINTMENT_ID);

      expect(mockLivekitRoomService.deleteRoom).toHaveBeenCalledOnce();
      expect(mockPrisma.videoRoom.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'ended' }),
      }));
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'completed' }),
      }));
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'VIDEO_CALL_END' }));
    });

    it('should skip session creation if appointment already has a session', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      const room = makeVideoRoom({
        status: 'active',
        psyJoinedAt: new Date(Date.now() - 50 * 60 * 1000),
        appointment: { ...makeAppointment(), sessionId: 'existing-session-id' },
      });
      mockPrisma.videoRoom.findFirst.mockResolvedValueOnce(room);
      mockLivekitRoomService.deleteRoom.mockResolvedValueOnce(undefined);
      mockPrisma.videoRoom.update.mockResolvedValueOnce({ ...room, status: 'ended' });
      mockPrisma.appointment.update.mockResolvedValueOnce({});

      await service.endRoom(PSY_USER_ID, APPOINTMENT_ID);

      expect(mockPrisma.session.create).not.toHaveBeenCalled();
    });
  });

  describe('cleanupOrphanedRooms()', () => {
    it('should close rooms active for >15 min with no participants', async () => {
      const orphanedRoom = makeVideoRoom({
        status: 'active',
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      });
      mockPrisma.videoRoom.findMany.mockResolvedValueOnce([orphanedRoom]);
      mockLivekitRoomService.listParticipants.mockResolvedValueOnce([]);
      mockLivekitRoomService.deleteRoom.mockResolvedValueOnce(undefined);
      mockPrisma.videoRoom.update.mockResolvedValueOnce({ ...orphanedRoom, status: 'ended' });

      await service.cleanupOrphanedRooms();

      expect(mockPrisma.videoRoom.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'ended' }),
      }));
    });
  });
});
