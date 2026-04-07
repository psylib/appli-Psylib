import { IsUUID } from 'class-validator';

export class CreateVideoRoomDto {
  @IsUUID()
  appointmentId!: string;
}

export interface VideoTokenResponse {
  token: string;
  wsUrl: string;
  roomName: string;
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
  patientName: string;
  scheduledAt: Date;
  duration: number;
  status: 'upcoming' | 'ready' | 'patient_waiting' | 'active' | 'ended';
  roomId: string | null;
}
