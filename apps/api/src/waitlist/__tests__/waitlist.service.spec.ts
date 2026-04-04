import { vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { WaitlistService } from '../waitlist.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  waitlistEntry: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  psychologist: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
};

const mockEncryption = {
  encryptNullable: vi.fn((text: string | null | undefined) =>
    text ? `encrypted:${text}` : null,
  ),
  decryptNullable: vi.fn((text: string | null) =>
    text ? text.replace('encrypted:', '') : null,
  ),
};

const mockNotifications = {
  createNotification: vi.fn(),
};

const mockEmail = {
  sendWaitlistProposal: vi.fn(),
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PSY_USER_ID = 'user-psy-001';
const PSY_ID = 'psy-001';
const ENTRY_ID = 'entry-001';

const fakePsy = { id: PSY_ID, userId: PSY_USER_ID, name: 'Dr. Dupont', slug: 'dr-dupont' };

const fakeEntry = {
  id: ENTRY_ID,
  psychologistId: PSY_ID,
  patientName: 'Jean Martin',
  patientEmail: 'jean@example.com',
  patientPhone: null,
  consultationTypeId: null,
  urgency: 'low',
  preferredSlots: null,
  note: 'encrypted:Anxiete generalisee',
  status: 'waiting',
  contactedAt: null,
  createdAt: new Date('2026-04-01T10:00:00Z'),
};

const createDto = {
  patientName: 'Jean Martin',
  patientEmail: 'jean@example.com',
  note: 'Anxiete generalisee',
};

// ---------------------------------------------------------------------------
// Helper to build the service with mocks
// ---------------------------------------------------------------------------

function createService(): WaitlistService {
  return new WaitlistService(
    mockPrisma as any,
    mockEncryption as any,
    mockNotifications as any,
    mockEmail as any,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WaitlistService', () => {
  let service: WaitlistService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
    mockPrisma.psychologist.findUnique.mockResolvedValue(fakePsy);
  });

  // ── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('encrypts note before saving', async () => {
      mockPrisma.waitlistEntry.create.mockResolvedValue(fakeEntry);

      await service.create(PSY_ID, createDto);

      expect(mockEncryption.encryptNullable).toHaveBeenCalledWith('Anxiete generalisee');
      expect(mockPrisma.waitlistEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          psychologistId: PSY_ID,
          patientName: 'Jean Martin',
          patientEmail: 'jean@example.com',
          note: 'encrypted:Anxiete generalisee',
        }),
      });
    });

    it('creates entry without note when not provided', async () => {
      const dtoNoNote = { patientName: 'Jean Martin', patientEmail: 'jean@example.com' };
      mockPrisma.waitlistEntry.create.mockResolvedValue({ ...fakeEntry, note: null });

      await service.create(PSY_ID, dtoNoNote);

      expect(mockEncryption.encryptNullable).toHaveBeenCalledWith(undefined);
      expect(mockPrisma.waitlistEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ note: null }),
      });
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('decrypts notes on read', async () => {
      mockPrisma.waitlistEntry.findMany.mockResolvedValue([fakeEntry]);

      const result = await service.findAll(PSY_ID);

      expect(mockEncryption.decryptNullable).toHaveBeenCalledWith('encrypted:Anxiete generalisee');
      expect(result[0].note).toBe('Anxiete generalisee');
    });

    it('orders by urgency desc then createdAt asc', async () => {
      mockPrisma.waitlistEntry.findMany.mockResolvedValue([]);

      await service.findAll(PSY_ID);

      expect(mockPrisma.waitlistEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { psychologistId: PSY_ID },
          orderBy: [
            { urgency: 'desc' },
            { createdAt: 'asc' },
          ],
        }),
      );
    });
  });

  // ── updateStatus ────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('sets contactedAt when status is contacted', async () => {
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue(fakeEntry);
      mockPrisma.waitlistEntry.update.mockResolvedValue({
        ...fakeEntry,
        status: 'contacted',
        contactedAt: new Date(),
      });

      await service.updateStatus(PSY_ID, ENTRY_ID, 'contacted');

      expect(mockPrisma.waitlistEntry.update).toHaveBeenCalledWith({
        where: { id: ENTRY_ID },
        data: expect.objectContaining({
          status: 'contacted',
          contactedAt: expect.any(Date),
        }),
      });
    });

    it('does not set contactedAt for other statuses', async () => {
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue(fakeEntry);
      mockPrisma.waitlistEntry.update.mockResolvedValue({
        ...fakeEntry,
        status: 'scheduled',
      });

      await service.updateStatus(PSY_ID, ENTRY_ID, 'scheduled');

      expect(mockPrisma.waitlistEntry.update).toHaveBeenCalledWith({
        where: { id: ENTRY_ID },
        data: { status: 'scheduled' },
      });
    });

    it('throws NotFoundException when entry not found', async () => {
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue(null);

      await expect(service.updateStatus(PSY_ID, 'nonexistent', 'contacted'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes entry after ownership check', async () => {
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue(fakeEntry);
      mockPrisma.waitlistEntry.delete.mockResolvedValue(fakeEntry);

      await service.remove(PSY_ID, ENTRY_ID);

      expect(mockPrisma.waitlistEntry.findFirst).toHaveBeenCalledWith({
        where: { id: ENTRY_ID, psychologistId: PSY_ID },
      });
      expect(mockPrisma.waitlistEntry.delete).toHaveBeenCalledWith({
        where: { id: ENTRY_ID },
      });
    });

    it('throws NotFoundException if entry does not belong to psy', async () => {
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue(null);

      await expect(service.remove(PSY_ID, 'wrong-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── proposeSlot ─────────────────────────────────────────────────────────

  describe('proposeSlot', () => {
    it('sends email and updates status to contacted', async () => {
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue(fakeEntry);
      mockPrisma.waitlistEntry.update.mockResolvedValue({
        ...fakeEntry,
        status: 'contacted',
        contactedAt: new Date(),
      });
      mockPrisma.psychologist.findUnique.mockResolvedValue(fakePsy);

      const slotDate = new Date('2026-04-10T14:00:00Z');
      await service.proposeSlot(PSY_ID, ENTRY_ID, slotDate);

      expect(mockPrisma.waitlistEntry.update).toHaveBeenCalledWith({
        where: { id: ENTRY_ID },
        data: {
          status: 'contacted',
          contactedAt: expect.any(Date),
        },
      });

      expect(mockEmail.sendWaitlistProposal).toHaveBeenCalledWith(
        'jean@example.com',
        expect.objectContaining({
          patientName: 'Jean Martin',
          psychologistName: 'Dr. Dupont',
          slotDate,
        }),
      );
    });

    it('throws NotFoundException when entry not found', async () => {
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.proposeSlot(PSY_ID, 'nonexistent', new Date()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── onAppointmentCancelled ──────────────────────────────────────────────

  describe('onAppointmentCancelled', () => {
    it('creates notification for psy about available slot', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValue(fakePsy);
      mockPrisma.waitlistEntry.findMany.mockResolvedValue([fakeEntry]);

      const cancelledDate = new Date('2026-04-10T14:00:00Z');
      await service.onAppointmentCancelled(PSY_ID, cancelledDate);

      expect(mockPrisma.waitlistEntry.findMany).toHaveBeenCalledWith({
        where: { psychologistId: PSY_ID, status: 'waiting' },
        orderBy: [{ urgency: 'desc' }, { createdAt: 'asc' }],
        take: 10,
      });

      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        PSY_USER_ID,
        'waitlist_slot_available',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          cancelledDate: cancelledDate.toISOString(),
          waitingCount: 1,
        }),
      );
    });

    it('does not notify when no entries are waiting', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValue(fakePsy);
      mockPrisma.waitlistEntry.findMany.mockResolvedValue([]);

      await service.onAppointmentCancelled(PSY_ID, new Date());

      expect(mockNotifications.createNotification).not.toHaveBeenCalled();
    });
  });

  // ── createPublic ────────────────────────────────────────────────────────

  describe('createPublic', () => {
    it('looks up psy by slug and creates entry', async () => {
      mockPrisma.psychologist.findFirst.mockResolvedValue(fakePsy);
      mockPrisma.waitlistEntry.create.mockResolvedValue(fakeEntry);

      await service.createPublic('dr-dupont', createDto);

      expect(mockPrisma.psychologist.findFirst).toHaveBeenCalledWith({
        where: { slug: 'dr-dupont' },
      });
      expect(mockPrisma.waitlistEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          psychologistId: PSY_ID,
          patientName: 'Jean Martin',
        }),
      });
    });

    it('throws NotFoundException when slug not found', async () => {
      mockPrisma.psychologist.findFirst.mockResolvedValue(null);

      await expect(service.createPublic('unknown-slug', createDto))
        .rejects.toThrow(NotFoundException);
    });
  });
});
