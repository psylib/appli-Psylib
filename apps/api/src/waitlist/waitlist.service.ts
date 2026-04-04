import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';

@Injectable()
export class WaitlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  // ── List all entries for a psychologist ──────────────────────────────────

  async findAll(psychologistId: string) {
    const entries = await this.prisma.waitlistEntry.findMany({
      where: { psychologistId },
      orderBy: [
        { urgency: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        consultationType: { select: { id: true, name: true } },
      },
    });

    return entries.map((entry) => ({
      ...entry,
      note: this.encryption.decryptNullable(entry.note),
    }));
  }

  // ── Create entry (authenticated psy) ────────────────────────────────────

  async create(psychologistId: string, dto: CreateWaitlistEntryDto) {
    return this.prisma.waitlistEntry.create({
      data: {
        psychologistId,
        patientName: dto.patientName,
        patientEmail: dto.patientEmail,
        patientPhone: dto.patientPhone,
        consultationTypeId: dto.consultationTypeId,
        urgency: dto.urgency ?? 'low',
        preferredSlots: dto.preferredSlots ?? undefined,
        note: this.encryption.encryptNullable(dto.note),
      },
    });
  }

  // ── Update status ───────────────────────────────────────────────────────

  async updateStatus(psychologistId: string, id: string, status: string) {
    const entry = await this.prisma.waitlistEntry.findFirst({
      where: { id, psychologistId },
    });
    if (!entry) throw new NotFoundException('Entrée liste d\'attente introuvable');

    const data: Record<string, unknown> = { status };
    if (status === 'contacted') {
      data.contactedAt = new Date();
    }

    return this.prisma.waitlistEntry.update({
      where: { id },
      data,
    });
  }

  // ── Remove entry ────────────────────────────────────────────────────────

  async remove(psychologistId: string, id: string) {
    const entry = await this.prisma.waitlistEntry.findFirst({
      where: { id, psychologistId },
    });
    if (!entry) throw new NotFoundException('Entrée liste d\'attente introuvable');

    return this.prisma.waitlistEntry.delete({ where: { id } });
  }

  // ── Propose a slot to a waitlist candidate ──────────────────────────────

  async proposeSlot(psychologistId: string, id: string, slotDate: Date) {
    const entry = await this.prisma.waitlistEntry.findFirst({
      where: { id, psychologistId },
    });
    if (!entry) throw new NotFoundException('Entrée liste d\'attente introuvable');

    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
    });

    await this.prisma.waitlistEntry.update({
      where: { id },
      data: {
        status: 'contacted',
        contactedAt: new Date(),
      },
    });

    const bookingUrl = `https://psylib.eu/psy/${psy!.slug}/book`;
    await this.email.sendWaitlistProposal(entry.patientEmail, {
      patientName: entry.patientName,
      psychologistName: psy!.name,
      slotDate,
      bookingUrl,
    });

    return { success: true };
  }

  // ── Public waitlist registration (no auth) ──────────────────────────────

  async createPublic(slug: string, dto: CreateWaitlistEntryDto) {
    const psy = await this.prisma.psychologist.findFirst({
      where: { slug },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    return this.create(psy.id, dto);
  }

  // ── Hook: called when an appointment is cancelled ───────────────────────

  async onAppointmentCancelled(psychologistId: string, cancelledDate: Date) {
    const waitingEntries = await this.prisma.waitlistEntry.findMany({
      where: { psychologistId, status: 'waiting' },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'asc' }],
      take: 10,
    });

    if (waitingEntries.length === 0) return;

    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
    });
    if (!psy) return;

    const dateStr = cancelledDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.notifications.createNotification(
      psy.userId,
      'waitlist_slot_available',
      'Créneau libéré — liste d\'attente',
      `Un RDV du ${dateStr} a été annulé. ${waitingEntries.length} patient(s) en attente.`,
      {
        cancelledDate: cancelledDate.toISOString(),
        waitingCount: waitingEntries.length,
        entries: waitingEntries.map((e) => ({
          id: e.id,
          name: e.patientName,
          urgency: e.urgency,
        })),
      },
    );
  }
}
