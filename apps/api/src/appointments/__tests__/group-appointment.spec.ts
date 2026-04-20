import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AppointmentsService } from '../appointments.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrisma = {
  psychologist: {
    findUnique: vi.fn(),
  },
  patient: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  appointment: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  appointmentParticipant: {
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
};

const mockAudit = {
  log: vi.fn(),
};

const mockEmail = {} as any;
const mockStripeService = {} as any;
const mockWaitlist = {} as any;
const mockNotifications = {} as any;
const mockConfig = {
  get: vi.fn().mockReturnValue('https://psylib.eu'),
} as any;

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PSY_USER_ID = 'user-psy-1';
const PSY_ID = 'psy-1';
const PRIMARY_PATIENT_ID = 'patient-primary';
const PARTICIPANT_1_ID = 'patient-participant-1';
const PARTICIPANT_2_ID = 'patient-participant-2';
const APPOINTMENT_ID = 'appt-group-1';

const mockPsychologist = {
  id: PSY_ID,
  userId: PSY_USER_ID,
  name: 'Dr. Group Test',
};

// ─── Service factory ──────────────────────────────────────────────────────────
function createService(): AppointmentsService {
  return new AppointmentsService(
    mockPrisma as never,
    mockAudit as never,
    mockEmail as never,
    mockStripeService as never,
    mockWaitlist as never,
    mockNotifications as never,
    mockConfig as never,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('AppointmentsService — createGroup()', () => {
  let service: AppointmentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  it('should reject duplicate patient IDs (primary in participants)', async () => {
    mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);

    await expect(
      service.createGroup(PSY_USER_ID, {
        patientId: PRIMARY_PATIENT_ID,
        participantIds: [PARTICIPANT_1_ID, PRIMARY_PATIENT_ID], // duplicate!
        scheduledAt: '2026-05-01T10:00:00Z',
        duration: 90,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject duplicate participant IDs among themselves', async () => {
    mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);

    await expect(
      service.createGroup(PSY_USER_ID, {
        patientId: PRIMARY_PATIENT_ID,
        participantIds: [PARTICIPANT_1_ID, PARTICIPANT_1_ID], // duplicate!
        scheduledAt: '2026-05-01T10:00:00Z',
        duration: 90,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject if patient not owned by psychologist', async () => {
    mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
    // Returns only 2 patients instead of expected 3
    mockPrisma.patient.findMany.mockResolvedValueOnce([
      { id: PRIMARY_PATIENT_ID, name: 'Primary', email: 'p@test.com' },
      { id: PARTICIPANT_1_ID, name: 'Part 1', email: 'p1@test.com' },
      // PARTICIPANT_2_ID is missing — not owned by this psy
    ]);

    await expect(
      service.createGroup(PSY_USER_ID, {
        patientId: PRIMARY_PATIENT_ID,
        participantIds: [PARTICIPANT_1_ID, PARTICIPANT_2_ID],
        scheduledAt: '2026-05-01T10:00:00Z',
        duration: 90,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create appointment with participant rows and audit log', async () => {
    const allPatientIds = [PRIMARY_PATIENT_ID, PARTICIPANT_1_ID, PARTICIPANT_2_ID];
    const allPatients = [
      { id: PRIMARY_PATIENT_ID, name: 'Primary', email: 'p@test.com' },
      { id: PARTICIPANT_1_ID, name: 'Part 1', email: 'p1@test.com' },
      { id: PARTICIPANT_2_ID, name: 'Part 2', email: null },
    ];

    mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
    mockPrisma.patient.findMany.mockResolvedValueOnce(allPatients);

    const createdAppointment = {
      id: APPOINTMENT_ID,
      psychologistId: PSY_ID,
      patientId: PRIMARY_PATIENT_ID,
      scheduledAt: new Date('2026-05-01T10:00:00Z'),
      duration: 90,
      status: 'scheduled',
      isOnline: true,
      videoJoinToken: 'some-uuid',
    };
    mockPrisma.appointment.create.mockResolvedValueOnce(createdAppointment);
    mockPrisma.appointmentParticipant.createMany.mockResolvedValueOnce({ count: 2 });

    const participantRows = [
      { id: 'ap-1', appointmentId: APPOINTMENT_ID, patientId: PARTICIPANT_1_ID, videoJoinToken: 'tok-1', patient: { id: PARTICIPANT_1_ID, name: 'Part 1', email: 'p1@test.com' } },
      { id: 'ap-2', appointmentId: APPOINTMENT_ID, patientId: PARTICIPANT_2_ID, videoJoinToken: 'tok-2', patient: { id: PARTICIPANT_2_ID, name: 'Part 2', email: null } },
    ];
    mockPrisma.appointmentParticipant.findMany.mockResolvedValueOnce(participantRows);

    const result = await service.createGroup(PSY_USER_ID, {
      patientId: PRIMARY_PATIENT_ID,
      participantIds: [PARTICIPANT_1_ID, PARTICIPANT_2_ID],
      scheduledAt: '2026-05-01T10:00:00Z',
      duration: 90,
    });

    // Appointment created with isOnline: true
    expect(mockPrisma.appointment.create).toHaveBeenCalledOnce();
    const createData = mockPrisma.appointment.create.mock.calls[0]?.[0]?.data;
    expect(createData.psychologistId).toBe(PSY_ID);
    expect(createData.patientId).toBe(PRIMARY_PATIENT_ID);
    expect(createData.isOnline).toBe(true);
    expect(createData.duration).toBe(90);

    // Participants created
    expect(mockPrisma.appointmentParticipant.createMany).toHaveBeenCalledOnce();
    const participantCreateData = mockPrisma.appointmentParticipant.createMany.mock.calls[0]?.[0]?.data;
    expect(participantCreateData).toHaveLength(2);
    expect(participantCreateData[0].patientId).toBe(PARTICIPANT_1_ID);
    expect(participantCreateData[1].patientId).toBe(PARTICIPANT_2_ID);
    // Each participant should have a videoJoinToken
    expect(participantCreateData[0].videoJoinToken).toBeDefined();
    expect(participantCreateData[1].videoJoinToken).toBeDefined();

    // Audit logged
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: PSY_USER_ID,
        actorType: 'psychologist',
        action: 'CREATE',
        entityType: 'appointment',
        entityId: APPOINTMENT_ID,
        metadata: expect.objectContaining({ isGroup: true }),
      }),
    );

    // Result shape
    expect(result.appointment).toEqual(createdAppointment);
    expect(result.participants).toEqual(participantRows);
    // Part 2 has no email
    expect(result.participantsWithoutEmail).toEqual([
      { id: PARTICIPANT_2_ID, name: 'Part 2' },
    ]);
  });
});
