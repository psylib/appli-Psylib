import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../notifications/email.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
} from './dto/appointment.dto';
import type { Appointment } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    @Inject(forwardRef(() => WaitlistService))
    private readonly waitlistService: WaitlistService,
  ) {}

  async create(userId: string, dto: CreateAppointmentDto): Promise<Appointment> {
    const psy = await this.getPsychologist(userId);

    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, psychologistId: psy.id },
      select: { name: true, email: true },
    });
    if (!patient) throw new NotFoundException('Patient introuvable ou non autorisé');

    const appointment = await this.prisma.appointment.create({
      data: {
        psychologistId: psy.id,
        patientId: dto.patientId,
        scheduledAt: new Date(dto.scheduledAt),
        duration: dto.duration,
        status: 'scheduled',
      },
    });

    // Email de confirmation au patient (si il a un email)
    if (patient.email) {
      void this.email.sendAppointmentConfirmation(patient.email, {
        patientName: patient.name,
        psychologistName: psy.name,
        scheduledAt: appointment.scheduledAt,
        duration: appointment.duration,
      });
    }

    return appointment;
  }

  async findAll(userId: string, query: AppointmentQueryDto) {
    const psy = await this.getPsychologist(userId);

    return this.prisma.appointment.findMany({
      where: {
        psychologistId: psy.id,
        ...(query.from && { scheduledAt: { gte: new Date(query.from) } }),
        ...(query.to && { scheduledAt: { lte: new Date(query.to) } }),
        ...(query.from && query.to && {
          scheduledAt: { gte: new Date(query.from), lte: new Date(query.to) },
        }),
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { name: true, email: true } },
        consultationType: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const psy = await this.getPsychologist(userId);

    const existing = await this.prisma.appointment.findFirst({
      where: { id, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('RDV introuvable');

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async cancel(userId: string, id: string): Promise<Appointment> {
    const psy = await this.getPsychologist(userId);

    const existing = await this.prisma.appointment.findFirst({
      where: { id, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('RDV introuvable');

    const cancelled = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Notify psy about waitlist candidates when a slot is freed
    void this.waitlistService.onAppointmentCancelled(psy.id, existing.scheduledAt);

    return cancelled;
  }

  async getPending(userId: string) {
    const psy = await this.getPsychologist(userId);
    return this.prisma.appointment.findMany({
      where: {
        psychologistId: psy.id,
        status: 'scheduled',
        source: 'public',
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { name: true, email: true, phone: true } },
      },
    });
  }

  async confirmAppointment(userId: string, id: string): Promise<Appointment> {
    const psy = await this.getPsychologist(userId);

    const existing = await this.prisma.appointment.findFirst({
      where: { id, psychologistId: psy.id },
      include: { patient: { select: { name: true, email: true } } },
    });
    if (!existing) throw new NotFoundException('RDV introuvable');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'confirmed' },
    });

    if (existing.patient.email) {
      void this.email.sendAppointmentConfirmation(existing.patient.email, {
        patientName: existing.patient.name,
        psychologistName: psy.name,
        scheduledAt: existing.scheduledAt,
        duration: existing.duration,
      });
    }

    return updated;
  }

  async declineAppointment(userId: string, id: string): Promise<Appointment> {
    const psy = await this.getPsychologist(userId);

    const existing = await this.prisma.appointment.findFirst({
      where: { id, psychologistId: psy.id },
      include: { patient: { select: { name: true, email: true } } },
    });
    if (!existing) throw new NotFoundException('RDV introuvable');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    if (existing.patient.email) {
      void this.email.sendBookingDeclined(existing.patient.email, {
        patientName: existing.patient.name,
        psychologistName: psy.name,
        scheduledAt: existing.scheduledAt,
      });
    }

    return updated;
  }

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }
}
