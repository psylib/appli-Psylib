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
import { RoomServiceClient, AccessToken, VideoGrant } from 'livekit-server-sdk';
import { Cron } from '@nestjs/schedule';
import { VideoTokenResponse, TodayVideoRoom } from './dto/video.dto';

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
  ) {
    this.livekitApiKey = this.config.get<string>('LIVEKIT_API_KEY', '');
    this.livekitApiSecret = this.config.get<string>('LIVEKIT_API_SECRET', '');
    this.livekitWsUrl = this.config.get<string>('LIVEKIT_WS_URL', '');
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

    // Check time window: 10 min before to end of appointment
    const now = new Date();
    const windowStart = new Date(appointment.scheduledAt.getTime() - 10 * 60 * 1000);
    const windowEnd = new Date(
      appointment.scheduledAt.getTime() + appointment.duration * 60 * 1000,
    );
    if (now < windowStart || now > windowEnd) {
      throw new BadRequestException('La visio ne peut être démarrée que 10 min avant le RDV');
    }

    // Check if this is a group appointment
    const participantCount = await this.prisma.appointmentParticipant.count({
      where: { appointmentId },
    });
    const isGroup = participantCount > 0;

    const roomName = `psylib-${appointmentId}`;
    await this.roomService.createRoom({
      name: roomName,
      emptyTimeout: isGroup ? 600 : 300,
      maxParticipants: isGroup ? 6 : undefined,
    });

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

    return {
      token: await token.toJwt(),
      wsUrl: this.livekitWsUrl,
      roomName: room.roomName,
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
  ): Promise<VideoTokenResponse & { needsConsent?: boolean }> {
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
              psychologist: { select: { name: true } },
            },
          },
        },
      });

      if (!participant) throw new UnauthorizedException('Lien de visio invalide ou expiré');

      appointment = participant.appointment as any;
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
      } as any;
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

    await this.audit.log({
      actorId: patientId,
      actorType: 'patient',
      action: 'VIDEO_PATIENT_JOIN',
      entityType: 'video_room',
      entityId: room.id,
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
  async recordConsent(joinToken: string, ipAddress?: string) {
    // Check primary patient token
    const appointment = await this.prisma.appointment.findFirst({
      where: { videoJoinToken: joinToken },
    });

    if (appointment) {
      await this.prisma.gdprConsent.create({
        data: {
          patientId: appointment.patientId,
          type: 'video_consultation',
          version: '2026-04-v1',
          ipAddress,
        },
      });
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

    // Auto-create session if none linked
    if (!room.appointment.sessionId) {
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
      const windowStart = new Date(appt.scheduledAt.getTime() - 10 * 60 * 1000);

      if (appt.videoRoom?.status === 'ended') {
        status = 'ended';
      } else if (appt.videoRoom?.psyJoinedAt && appt.videoRoom?.patientJoinedAt) {
        status = 'active';
      } else if (appt.videoRoom?.patientJoinedAt) {
        status = 'patient_waiting';
      } else if (now >= windowStart) {
        status = 'ready';
      }

      const participantCount = 1 + appt.participants.length;
      const secondaryJoined = appt.participants.filter((p) => p.joinedAt).length;
      const primaryJoined = appt.videoRoom?.patientJoinedAt ? 1 : 0;
      const participantsJoined = secondaryJoined + primaryJoined;

      return {
        appointmentId: appt.id,
        patientName: appt.patient.name,
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
