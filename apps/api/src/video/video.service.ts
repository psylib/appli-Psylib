import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { RoomServiceClient, AccessToken, VideoGrant } from 'livekit-server-sdk';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { VideoTokenResponse, TodayVideoRoom, ScribeStatusResponse } from './dto/video.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SCRIBE_QUEUE, ScribeJobData } from './scribe.processor';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly livekitApiKey: string;
  private readonly livekitApiSecret: string;
  private readonly livekitWsUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly roomService: RoomServiceClient,
    private readonly config: ConfigService,
    private readonly notificationGateway: NotificationGateway,
    @InjectQueue(SCRIBE_QUEUE) private readonly scribeQueue: Queue<ScribeJobData>,
  ) {
    this.livekitApiKey = this.config.get<string>('LIVEKIT_API_KEY', '');
    this.livekitApiSecret = this.config.get<string>('LIVEKIT_API_SECRET', '');
    this.livekitWsUrl = this.config.get<string>('LIVEKIT_WS_URL', '');

    if (!this.livekitApiKey || !this.livekitApiSecret || !this.livekitWsUrl) {
      this.logger.warn('LIVEKIT_API_KEY, LIVEKIT_API_SECRET ou LIVEKIT_WS_URL manquante — la visio sera désactivée');
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }

  // ─── Room Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Creates a LiveKit room for a given online appointment.
   * Idempotent — returns existing room if already created.
   */
  async createRoom(userId: string, appointmentId: string) {
    const psy = await this.getPsychologist(userId);

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, psychologistId: psy.id },
      include: { videoRoom: true, patient: { select: { name: true, email: true } } },
    });

    if (!appointment) throw new NotFoundException('Rendez-vous introuvable');
    if (!appointment.isOnline) throw new BadRequestException("Ce rendez-vous n'est pas en visio");
    if (['cancelled', 'completed'].includes(appointment.status)) {
      throw new BadRequestException('Ce rendez-vous est annulé ou terminé');
    }

    // Idempotent: return existing room
    if (appointment.videoRoom) return appointment.videoRoom;

    // Skip time window for instant rooms (source === 'instant')
    if (appointment.source !== 'instant') {
      const now = new Date();
      const windowStart = new Date(appointment.scheduledAt.getTime() - 10 * 60 * 1000);
      const windowEnd = new Date(
        appointment.scheduledAt.getTime() + appointment.duration * 60 * 1000,
      );
      if (now < windowStart || now > windowEnd) {
        throw new BadRequestException('La visio ne peut être démarrée que 10 min avant le RDV');
      }
    }

    // Check if this is a group appointment
    const participantCount = await this.prisma.appointmentParticipant.count({
      where: { appointmentId },
    });
    const isGroup = participantCount > 0;

    const roomName = `psylib-${appointmentId}`;
    try {
      await this.roomService.createRoom({
        name: roomName,
        emptyTimeout: isGroup ? 600 : 300,
        maxParticipants: isGroup ? 6 : undefined,
      });
    } catch (e) {
      this.logger.error(`Failed to create LiveKit room ${roomName}: ${e}`);
      throw new BadRequestException('Impossible de créer la salle de visio — le serveur vidéo est indisponible');
    }

    const videoRoom = await this.prisma.videoRoom.create({
      data: {
        appointmentId,
        psychologistId: psy.id,
        roomName,
        status: 'waiting',
      },
    });

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'VIDEO_ROOM_CREATED',
      entityType: 'video_room',
      entityId: videoRoom.id,
      metadata: { appointmentId },
    });

    return videoRoom;
  }

  // ─── Instant Video ──────────────────────────────────────────────────────────────

  /**
   * Creates an instant video room — no prior appointment required.
   * Optionally linked to a patient. Returns psy token + patient link.
   */
  async createInstantRoom(userId: string, patientId?: string) {
    if (!this.livekitApiKey || !this.livekitApiSecret || !this.livekitWsUrl) {
      throw new ForbiddenException('Visio non configurée — clés LiveKit manquantes');
    }

    const psy = await this.getPsychologist(userId);

    if (patientId) {
      const patient = await this.prisma.patient.findFirst({
        where: { id: patientId, psychologistId: psy.id },
      });
      if (!patient) throw new NotFoundException('Patient introuvable');
    }

    const videoJoinToken = crypto.randomUUID();

    const appointment = await this.prisma.appointment.create({
      data: {
        psychologistId: psy.id,
        patientId: patientId ?? null,
        scheduledAt: new Date(),
        duration: 120,
        status: 'confirmed',
        isOnline: true,
        source: 'instant',
        videoJoinToken,
      },
    });

    const roomName = `psylib-${appointment.id}`;
    try {
      await this.roomService.createRoom({
        name: roomName,
        emptyTimeout: 300,
      });
    } catch (e) {
      await this.prisma.appointment.delete({ where: { id: appointment.id } });
      this.logger.error(`Failed to create LiveKit room for instant video: ${e}`);
      throw new BadRequestException('Impossible de créer la salle de visio — le serveur vidéo est indisponible');
    }

    const videoRoom = await this.prisma.videoRoom.create({
      data: {
        appointmentId: appointment.id,
        psychologistId: psy.id,
        roomName,
        status: 'waiting',
      },
    });

    const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
      identity: `psy-${psy.id}`,
      name: psy.name || 'Psychologue',
      ttl: 150 * 60,
    });
    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    };
    token.addGrant(grant);

    // Visio instantanée SANS patient : le lien portail patient est inutilisable
    // (generatePatientToken exige un patient). On génère un lien invité (flux
    // video_guests avec salle d'attente) qui, lui, fonctionne sans dossier patient.
    const guestInviteToken = patientId ? null : crypto.randomUUID();

    await this.prisma.videoRoom.update({
      where: { id: videoRoom.id },
      data: {
        psyJoinedAt: new Date(),
        status: 'active',
        ...(guestInviteToken ? { guestInviteToken } : {}),
      },
    });

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'VIDEO_INSTANT_CREATED',
      entityType: 'video_room',
      entityId: videoRoom.id,
      metadata: { appointmentId: appointment.id, patientId: patientId ?? null },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const patientLink = guestInviteToken
      ? `${frontendUrl}/video/guest/${guestInviteToken}`
      : `${frontendUrl}/patient-portal/video/${videoJoinToken}`;

    return {
      appointmentId: appointment.id,
      token: await token.toJwt(),
      wsUrl: this.livekitWsUrl,
      roomName,
      patientLink,
      isGuestLink: !patientId,
      durationMin: 120,
    };
  }

  // ─── Token Generation ─────────────────────────────────────────────────────────

  /**
   * Generates a LiveKit access token for the psychologist.
   * Marks the psy as joined on first call.
   */
  async generatePsyToken(userId: string, appointmentId: string): Promise<VideoTokenResponse> {
    if (!this.livekitApiKey || !this.livekitApiSecret) {
      throw new ForbiddenException('Visio non configurée — clés LiveKit manquantes');
    }

    const psy = await this.getPsychologist(userId);

    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
      include: { appointment: true },
    });

    if (!room) throw new NotFoundException('Salle de visio introuvable');
    if (room.status === 'ended') throw new BadRequestException('Cette consultation est terminée');

    const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
      identity: `psy-${psy.id}`,
      name: psy.name || 'Psychologue',
      ttl: (room.appointment.duration + 30) * 60, // seconds
    });
    const grant: VideoGrant = {
      room: room.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    };
    token.addGrant(grant);

    // Mark psy joined
    if (!room.psyJoinedAt) {
      await this.prisma.videoRoom.update({
        where: { id: room.id },
        data: { psyJoinedAt: new Date(), status: 'active' },
      });
    }

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'VIDEO_PSY_JOIN',
      entityType: 'video_room',
      entityId: room.id,
    });

    // Check patient scribe consent
    const patientScribeConsent = room.appointment.patientId
      ? !!(await this.prisma.gdprConsent.findFirst({
          where: {
            patientId: room.appointment.patientId,
            type: 'ai_video_transcription',
            withdrawnAt: null,
          },
        }))
      : false;

    return {
      token: await token.toJwt(),
      wsUrl: this.livekitWsUrl,
      roomName: room.roomName,
      durationMin: room.appointment.duration,
      patientScribeConsent,
      scribeEnabled: room.scribeEnabled,
      scribeStatus: room.scribeStatus as 'none' | 'processing' | 'done' | 'failed',
      patientId: room.appointment.patientId,
    };
  }

  /**
   * Generates a LiveKit access token for the patient, using the videoJoinToken.
   * Supports both primary patient (appointment.videoJoinToken) and secondary
   * participants (appointmentParticipant.videoJoinToken).
   * Returns { needsConsent: true } if the patient has not yet consented to video.
   */
  async generatePatientToken(
    joinToken: string,
  ): Promise<VideoTokenResponse & { needsConsent?: boolean; patientName?: string; psychologistName?: string }> {
    if (!this.livekitApiKey || !this.livekitApiSecret) {
      throw new ForbiddenException('Visio non configurée — clés LiveKit manquantes');
    }

    // First: check primary patient token on appointment
    let appointment = await this.prisma.appointment.findFirst({
      where: { videoJoinToken: joinToken },
      include: {
        videoRoom: true,
        patient: { select: { id: true, name: true } },
        psychologist: { select: { name: true } },
      },
    });

    let patientId: string;
    let patientName: string;
    let psychologistName: string;

    if (appointment) {
      // Instant room without patient — no patient token needed
      if (!appointment.patient) {
        throw new BadRequestException('Cette visio instantanée n\'a pas de patient associé');
      }
      patientId = appointment.patient.id;
      patientName = appointment.patient.name;
      psychologistName = appointment.psychologist.name;
    } else {
      // Second: check participant token
      const participant = await this.prisma.appointmentParticipant.findFirst({
        where: { videoJoinToken: joinToken },
        include: {
          patient: { select: { id: true, name: true } },
          appointment: {
            include: {
              videoRoom: true,
              patient: { select: { id: true, name: true } },
              psychologist: { select: { name: true } },
            },
          },
        },
      });

      if (!participant) throw new UnauthorizedException('Lien de visio invalide ou expiré');

      appointment = participant.appointment;
      patientId = participant.patient.id;
      patientName = participant.patient.name;
      psychologistName = participant.appointment.psychologist.name;
    }

    if (!appointment!.videoRoom)
      throw new BadRequestException("La salle de visio n'est pas encore prête");
    if (appointment!.videoRoom.status === 'ended')
      throw new BadRequestException('Cette consultation est terminée');

    // Check GDPR consent for THIS specific participant
    const consent = await this.prisma.gdprConsent.findFirst({
      where: {
        patientId,
        type: 'video_consultation',
        withdrawnAt: null,
      },
    });

    if (!consent) {
      return {
        needsConsent: true,
        token: '',
        wsUrl: '',
        roomName: '',
        patientName,
        psychologistName,
      };
    }

    const room = appointment!.videoRoom!;
    const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
      identity: `patient-${patientId}`,
      name: patientName || 'Patient',
      ttl: (appointment!.duration + 30) * 60,
    });
    const grant: VideoGrant = {
      room: room.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    };
    token.addGrant(grant);

    // Update join tracking - first participant sets VideoRoom.patientJoinedAt
    if (!room.patientJoinedAt) {
      await this.prisma.videoRoom.update({
        where: { id: room.id },
        data: { patientJoinedAt: new Date(), status: 'active' },
      });
    }

    // If this is a secondary participant, update their joinedAt
    if (patientId !== appointment!.patientId) {
      await this.prisma.appointmentParticipant.updateMany({
        where: { appointmentId: appointment!.id, patientId },
        data: { joinedAt: new Date() },
      });
    }

    // Notify psy in realtime that patient has joined
    const psyUserId = await this.prisma.psychologist.findUnique({
      where: { id: room.psychologistId },
      select: { userId: true },
    });
    if (psyUserId) {
      this.notificationGateway.sendToUser(psyUserId.userId, {
        type: 'video_patient_joined',
        title: `${patientName} a rejoint la visio`,
        data: { appointmentId: appointment!.id, roomId: room.id },
      });
    }

    await this.audit.log({
      actorId: patientId,
      actorType: 'patient',
      action: 'VIDEO_PATIENT_JOIN',
      entityType: 'appointment',
      entityId: appointment!.id,
      metadata: { roomId: room.id },
    });

    return {
      token: await token.toJwt(),
      wsUrl: this.livekitWsUrl,
      roomName: room.roomName,
    };
  }

  /**
   * Records GDPR consent for video consultation from a patient.
   * Supports both primary patient and secondary participants.
   */
  async recordConsent(joinToken: string, ipAddress?: string, includeScribe = false) {
    // Check primary patient token
    const appointment = await this.prisma.appointment.findFirst({
      where: { videoJoinToken: joinToken },
    });

    if (appointment) {
      // Skip consent for instant rooms without patient
      if (!appointment.patientId) return;
      await this.prisma.gdprConsent.create({
        data: {
          patientId: appointment.patientId,
          type: 'video_consultation',
          version: '2026-04-v1',
          ipAddress,
        },
      });
      if (includeScribe) {
        await this.prisma.gdprConsent.create({
          data: {
            patientId: appointment.patientId,
            type: 'ai_video_transcription',
            version: '2026-06-v1',
            ipAddress,
          },
        });
      }
      return;
    }

    // Check participant token
    const participant = await this.prisma.appointmentParticipant.findFirst({
      where: { videoJoinToken: joinToken },
    });
    if (!participant) throw new UnauthorizedException('Lien invalide');

    await this.prisma.gdprConsent.create({
      data: {
        patientId: participant.patientId,
        type: 'video_consultation',
        version: '2026-04-v1',
        ipAddress,
      },
    });
    if (includeScribe) {
      await this.prisma.gdprConsent.create({
        data: {
          patientId: participant.patientId,
          type: 'ai_video_transcription',
          version: '2026-06-v1',
          ipAddress,
        },
      });
    }
  }

  /**
   * Ends a video room, marks appointment completed, auto-creates a session.
   */
  async endRoom(userId: string, appointmentId: string): Promise<void> {
    const psy = await this.getPsychologist(userId);

    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
      include: { appointment: true },
    });

    if (!room) throw new NotFoundException('Salle de visio introuvable');

    // Close LiveKit room
    try {
      await this.roomService.deleteRoom(room.roomName);
    } catch (e) {
      this.logger.warn(`Failed to delete LiveKit room ${room.roomName}: ${e}`);
    }

    // Calculate duration
    const startTime = room.psyJoinedAt || room.createdAt;
    const durationMinutes = Math.round((Date.now() - startTime.getTime()) / 60000);

    // Update room status
    await this.prisma.videoRoom.update({
      where: { id: room.id },
      data: { status: 'ended', endedAt: new Date() },
    });

    // Update appointment status
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'completed' },
    });

    // Get participant IDs for group sessions
    const participants = await this.prisma.appointmentParticipant.findMany({
      where: { appointmentId },
      select: { patientId: true },
    });
    const participantIds = participants.map((p) => p.patientId);

    // Auto-create session if none linked AND patient exists
    if (!room.appointment.sessionId && room.appointment.patientId) {
      const session = await this.prisma.session.create({
        data: {
          patientId: room.appointment.patientId,
          psychologistId: psy.id,
          date: startTime,
          duration: durationMinutes,
          type: participantIds.length > 0 ? 'group' : 'online',
          paymentStatus: 'pending',
          participantIds,
        },
      });
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { sessionId: session.id },
      });
    }

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'VIDEO_CALL_END',
      entityType: 'video_room',
      entityId: room.id,
      metadata: { durationMinutes },
    });
  }

  // ─── Queries ──────────────────────────────────────────────────────────────────

  /**
   * Returns today's online appointments with their video room status.
   */
  async getTodayRooms(userId: string): Promise<TodayVideoRoom[]> {
    const psy = await this.getPsychologist(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        psychologistId: psy.id,
        isOnline: true,
        scheduledAt: { gte: today, lt: tomorrow },
        status: { notIn: ['cancelled'] },
      },
      include: {
        patient: { select: { name: true } },
        videoRoom: true,
        participants: {
          select: {
            patientId: true,
            joinedAt: true,
            patient: { select: { name: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const now = new Date();
    return appointments.map((appt) => {
      let status: TodayVideoRoom['status'] = 'upcoming';
      const isInstant = appt.source === 'instant';
      const windowStart = new Date(appt.scheduledAt.getTime() - 10 * 60 * 1000);

      if (appt.videoRoom?.status === 'ended') {
        status = 'ended';
      } else if (appt.videoRoom?.psyJoinedAt && appt.videoRoom?.patientJoinedAt) {
        status = 'active';
      } else if (appt.videoRoom?.patientJoinedAt) {
        status = 'patient_waiting';
      } else if (isInstant || now >= windowStart) {
        status = 'ready';
      }

      const participantCount = 1 + appt.participants.length;
      const secondaryJoined = appt.participants.filter((p) => p.joinedAt).length;
      const primaryJoined = appt.videoRoom?.patientJoinedAt ? 1 : 0;
      const participantsJoined = secondaryJoined + primaryJoined;

      return {
        appointmentId: appt.id,
        patientName: appt.patient?.name ?? null,
        scheduledAt: appt.scheduledAt,
        duration: appt.duration,
        status,
        roomId: appt.videoRoom?.id ?? null,
        participantCount,
        participantsJoined,
        participantNames: appt.participants.map((p) => p.patient.name),
      };
    });
  }

  /**
   * Returns room info for a specific appointment.
   */
  async getRoomInfo(userId: string, appointmentId: string) {
    const psy = await this.getPsychologist(userId);
    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
      include: {
        appointment: { select: { scheduledAt: true, duration: true, patientId: true } },
      },
    });
    if (!room) throw new NotFoundException('Salle de visio introuvable');
    return room;
  }

  // ─── Guest Invite / Salle d'attente ────────────────────────────────────────────

  /**
   * Génère (ou retourne) le lien d'invitation invité pour une room en cours.
   * Le psy partage ce lien à qui il veut (collègue, proche, superviseur).
   */
  async createGuestInvite(userId: string, appointmentId: string) {
    const psy = await this.getPsychologist(userId);
    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
    });
    if (!room) throw new NotFoundException('Salle de visio introuvable');
    if (room.status === 'ended') throw new BadRequestException('Cette consultation est terminée');

    let inviteToken = room.guestInviteToken;
    if (!inviteToken) {
      inviteToken = crypto.randomUUID();
      await this.prisma.videoRoom.update({
        where: { id: room.id },
        data: { guestInviteToken: inviteToken },
      });
    }

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'VIDEO_GUEST_INVITE',
      entityType: 'video_room',
      entityId: room.id,
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    return { inviteUrl: `${frontendUrl}/video/guest/${inviteToken}` };
  }

  /**
   * Révoque le lien d'invitation : invalide le token et refuse les invités en attente.
   */
  async revokeGuestInvite(userId: string, appointmentId: string) {
    const psy = await this.getPsychologist(userId);
    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
    });
    if (!room) throw new NotFoundException('Salle de visio introuvable');

    await this.prisma.videoGuest.updateMany({
      where: { videoRoomId: room.id, status: 'pending' },
      data: { status: 'denied' },
    });
    await this.prisma.videoRoom.update({
      where: { id: room.id },
      data: { guestInviteToken: null },
    });
    return { ok: true };
  }

  /**
   * Liste des invités en attente / admis (polled côté psy pour la bannière d'admission).
   */
  async listGuests(userId: string, appointmentId: string) {
    const psy = await this.getPsychologist(userId);
    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
      select: { id: true },
    });
    if (!room) throw new NotFoundException('Salle de visio introuvable');

    return this.prisma.videoGuest.findMany({
      where: { videoRoomId: room.id, status: { in: ['pending', 'admitted'] } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, displayName: true, status: true, createdAt: true, admittedAt: true },
    });
  }

  /** Admet un invité : il pourra alors récupérer son token LiveKit. */
  async admitGuest(userId: string, guestId: string) {
    const psy = await this.getPsychologist(userId);
    const guest = await this.prisma.videoGuest.findUnique({
      where: { id: guestId },
      include: { videoRoom: { select: { id: true, psychologistId: true, status: true } } },
    });
    if (!guest || guest.videoRoom.psychologistId !== psy.id) {
      throw new NotFoundException('Invité introuvable');
    }
    if (guest.videoRoom.status === 'ended') {
      throw new BadRequestException('Cette consultation est terminée');
    }
    if (guest.status === 'denied') throw new BadRequestException('Cet invité a été refusé');

    await this.prisma.videoGuest.update({
      where: { id: guestId },
      data: { status: 'admitted', admittedAt: new Date() },
    });
    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'VIDEO_GUEST_ADMIT',
      entityType: 'video_room',
      entityId: guest.videoRoom.id,
      metadata: { guestId, displayName: guest.displayName },
    });
    return { ok: true };
  }

  /** Refuse un invité en attente. */
  async denyGuest(userId: string, guestId: string) {
    const psy = await this.getPsychologist(userId);
    const guest = await this.prisma.videoGuest.findUnique({
      where: { id: guestId },
      include: { videoRoom: { select: { id: true, psychologistId: true } } },
    });
    if (!guest || guest.videoRoom.psychologistId !== psy.id) {
      throw new NotFoundException('Invité introuvable');
    }

    await this.prisma.videoGuest.update({
      where: { id: guestId },
      data: { status: 'denied' },
    });
    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'VIDEO_GUEST_DENY',
      entityType: 'video_room',
      entityId: guest.videoRoom.id,
      metadata: { guestId },
    });
    return { ok: true };
  }

  // ─── Guest Public Flow ──────────────────────────────────────────────────────────

  /** (Public) Valide un lien d'invitation et renvoie le contexte d'affichage. */
  async resolveGuestInvite(inviteToken: string) {
    const room = await this.prisma.videoRoom.findFirst({
      where: { guestInviteToken: inviteToken },
      include: { psychologist: { select: { name: true } } },
    });
    if (!room) throw new UnauthorizedException('Lien invalide ou expiré');
    if (room.status === 'ended') throw new BadRequestException('Cette consultation est terminée');
    return { valid: true, psychologistName: room.psychologist.name };
  }

  /**
   * (Public) Un invité demande à rejoindre : crée une entrée `pending`,
   * enregistre son consentement, et notifie le psy en temps réel.
   */
  async requestGuestJoin(inviteToken: string, displayName: string, ipAddress?: string) {
    const room = await this.prisma.videoRoom.findFirst({
      where: { guestInviteToken: inviteToken },
    });
    if (!room) throw new UnauthorizedException('Lien invalide ou expiré');
    if (room.status === 'ended') throw new BadRequestException('Cette consultation est terminée');

    const cleanName = (displayName || '').trim().slice(0, 60) || 'Invité';
    const sessionToken = crypto.randomUUID();

    const guest = await this.prisma.videoGuest.create({
      data: {
        videoRoomId: room.id,
        displayName: cleanName,
        sessionToken,
        status: 'pending',
        consentAt: new Date(),
        ipAddress,
      },
    });

    const psy = await this.prisma.psychologist.findUnique({
      where: { id: room.psychologistId },
      select: { userId: true },
    });
    if (psy) {
      this.notificationGateway.sendToUser(psy.userId, {
        type: 'video_guest_waiting',
        title: `${cleanName} souhaite rejoindre la visio`,
        data: { roomId: room.id, guestId: guest.id },
      });
    }

    await this.audit.log({
      actorId: guest.id,
      actorType: 'guest',
      action: 'VIDEO_GUEST_REQUEST',
      entityType: 'video_room',
      entityId: room.id,
      metadata: { displayName: cleanName },
    });

    return { sessionToken };
  }

  /**
   * (Public) L'invité poll son statut. Une fois admis, reçoit son token LiveKit.
   */
  async getGuestStatus(sessionToken: string): Promise<{
    status: 'pending' | 'admitted' | 'denied' | 'ended';
    token?: string;
    wsUrl?: string;
    roomName?: string;
  }> {
    const guest = await this.prisma.videoGuest.findUnique({
      where: { sessionToken },
      include: { videoRoom: { select: { status: true, roomName: true } } },
    });
    if (!guest) throw new UnauthorizedException('Session invalide');

    if (guest.videoRoom.status === 'ended') return { status: 'ended' };
    if (guest.status === 'denied') return { status: 'denied' };
    if (guest.status !== 'admitted') return { status: 'pending' };

    if (!this.livekitApiKey || !this.livekitApiSecret) {
      throw new ForbiddenException('Visio non configurée — clés LiveKit manquantes');
    }

    const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
      identity: `guest-${guest.id}`,
      name: guest.displayName,
      ttl: 180 * 60,
    });
    token.addGrant({
      room: guest.videoRoom.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return {
      status: 'admitted',
      token: await token.toJwt(),
      wsUrl: this.livekitWsUrl,
      roomName: guest.videoRoom.roomName,
    };
  }

  // ─── Scribe IA ────────────────────────────────────────────────────────────────

  async enableScribe(userId: string, appointmentId: string, enabled: boolean): Promise<{ scribeEnabled: boolean }> {
    const psy = await this.getPsychologist(userId);
    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
    });
    if (!room) throw new NotFoundException('Salle de visio introuvable');
    if (room.status === 'ended') throw new BadRequestException('La consultation est terminée');

    const newValue = enabled;
    await this.prisma.videoRoom.update({
      where: { id: room.id },
      data: { scribeEnabled: newValue },
    });

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: newValue ? 'SCRIBE_ENABLED' : 'SCRIBE_DISABLED',
      entityType: 'video_room',
      entityId: room.id,
    });

    return { scribeEnabled: newValue };
  }

  async uploadScribeAudio(
    userId: string,
    appointmentId: string,
    audioBuffer: Buffer,
  ): Promise<{ status: string }> {
    const psy = await this.getPsychologist(userId);
    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
    });
    if (!room) throw new NotFoundException('Salle de visio introuvable');
    if (room.status === 'ended') throw new BadRequestException('La consultation est terminée');
    if (!room.scribeEnabled) throw new BadRequestException("Le Scribe IA n'était pas activé pour cette séance");

    if (audioBuffer.length > 25 * 1024 * 1024) {
      throw new BadRequestException('Fichier audio trop volumineux (max 25 MB)');
    }

    // HDS / RGPD règle absolue #3 : la transcription d'une séance ne part vers
    // les LLM (Whisper + OpenRouter) QUE si le patient a explicitement consenti.
    // Le flag scribeEnabled (réglage psy) ne suffit pas — on exige le consentement
    // ai_video_transcription côté serveur, jamais seulement côté UI.
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { patientId: true },
    });
    if (!appointment?.patientId) {
      throw new ForbiddenException(
        "Le Scribe IA nécessite un patient identifié et son consentement — indisponible pour une visio instantanée sans patient.",
      );
    }
    const scribeConsent = await this.prisma.gdprConsent.findFirst({
      where: {
        patientId: appointment.patientId,
        type: 'ai_video_transcription',
        withdrawnAt: null,
      },
    });
    if (!scribeConsent) {
      throw new ForbiddenException(
        "Le patient n'a pas consenti à la transcription IA de la séance. "
        + "La transcription automatique est désactivée tant que ce consentement n'est pas recueilli.",
      );
    }

    // Atomic check-and-set: prevents race condition on concurrent uploads
    const updated = await this.prisma.videoRoom.updateMany({
      where: { id: room.id, scribeStatus: 'none' },
      data: { scribeStatus: 'processing' },
    });
    if (updated.count === 0) {
      throw new BadRequestException('Transcription déjà en cours ou terminée');
    }

    const fileName = `psylib-scribe-${room.id}-${crypto.randomUUID()}.webm`;
    const filePath = path.join(os.tmpdir(), fileName);
    await fsPromises.writeFile(filePath, audioBuffer);

    await this.scribeQueue.add('process', {
      videoRoomId: room.id,
      audioFilePath: filePath,
    });

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'SCRIBE_AUDIO_UPLOADED',
      entityType: 'video_room',
      entityId: room.id,
      metadata: { sizeBytes: audioBuffer.length },
    });

    return { status: 'processing' };
  }

  async getScribeStatus(userId: string, appointmentId: string): Promise<ScribeStatusResponse> {
    const psy = await this.getPsychologist(userId);
    const room = await this.prisma.videoRoom.findFirst({
      where: { appointmentId, psychologistId: psy.id },
      select: { scribeEnabled: true, scribeStatus: true },
    });
    if (!room) throw new NotFoundException('Salle de visio introuvable');
    return {
      scribeEnabled: room.scribeEnabled,
      status: room.scribeStatus as 'none' | 'processing' | 'done' | 'failed',
    };
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────────

  /**
   * Cron job: every 5 minutes, close rooms that are active >15min with no participants.
   */
  @Cron('*/5 * * * *')
  async cleanupOrphanedRooms(): Promise<void> {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

    const orphanedRooms = await this.prisma.videoRoom.findMany({
      where: {
        status: { in: ['waiting', 'active'] },
        createdAt: { lt: fifteenMinAgo },
      },
    });

    for (const room of orphanedRooms) {
      try {
        const participants = await this.roomService.listParticipants(room.roomName);
        if (participants.length === 0) {
          await this.roomService.deleteRoom(room.roomName);
          await this.prisma.videoRoom.update({
            where: { id: room.id },
            data: { status: 'ended', endedAt: new Date() },
          });
          await this.audit.log({
            actorId: 'system',
            actorType: 'system',
            action: 'VIDEO_ROOM_CLEANUP',
            entityType: 'video_room',
            entityId: room.id,
          });
          this.logger.log(`Cleaned up orphaned room ${room.roomName}`);
        }
      } catch {
        // Room may not exist in LiveKit anymore — clean up DB record
        await this.prisma.videoRoom.update({
          where: { id: room.id },
          data: { status: 'ended', endedAt: new Date() },
        });
      }
    }
  }
}
