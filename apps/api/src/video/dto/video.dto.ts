import { IsUUID, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVideoRoomDto {
  @IsUUID()
  appointmentId!: string;
}

export class CreateInstantVideoDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;
}

export class GuestJoinRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  displayName!: string;
}

export interface VideoTokenResponse {
  token: string;
  wsUrl: string;
  roomName: string;
  durationMin?: number;
}

export interface VideoRoomResponse {
  id: string;
  appointmentId: string;
  roomName: string;
  status: string;
  psyJoinedAt: Date | null;
  patientJoinedAt: Date | null;
  createdAt: Date;
}

export interface TodayVideoRoom {
  appointmentId: string;
  patientName: string | null;
  scheduledAt: Date;
  duration: number;
  status: 'upcoming' | 'ready' | 'patient_waiting' | 'active' | 'ended';
  roomId: string | null;
  participantCount: number;
  participantsJoined: number;
  participantNames: string[];
}
