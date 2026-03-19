import {
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Request DTOs ────────────────────────────────────────────────

export class CreateConversationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  patientId!: string;
}

export class SendMessageDto {
  @ApiProperty({ example: 'Bonjour, comment vous sentez-vous ?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content!: string;
}

export class JoinConversationPayload {
  @IsUUID()
  conversationId!: string;
}

export class SendMessagePayload {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content!: string;
}

export class MarkReadPayload {
  @IsUUID()
  conversationId!: string;
}

// ─── Response DTOs ───────────────────────────────────────────────

export class MessageDto {
  id!: string;
  conversationId!: string;
  senderId!: string;
  content!: string; // déchiffré
  readAt!: Date | null;
  createdAt!: Date;
}

export class ConversationSummaryDto {
  id!: string;
  psychologistId!: string;
  patientId!: string;
  createdAt!: Date;
  lastMessage!: MessageDto | null;
  unreadCount!: number;
  patient?: {
    id: string;
    name: string;
  };
  psychologist?: {
    id: string;
    name: string;
  };
}

export class MessagesReadEventDto {
  conversationId!: string;
  readAt!: Date;
}
