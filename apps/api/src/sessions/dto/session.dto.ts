import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  IsArray,
  IsUUID,
  IsObject,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionType, SessionPaymentStatus } from '@psyscale/shared-types';
import { TherapyOrientation } from '@prisma/client';

export class CreateSessionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  patientId!: string;

  @ApiProperty({ example: '2024-02-15T14:00:00Z' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 50, description: 'Durée en minutes' })
  @IsNumber()
  @Min(5)
  @Max(480)
  duration!: number;

  @ApiPropertyOptional({ enum: SessionType, default: SessionType.INDIVIDUAL })
  @IsEnum(SessionType)
  @IsOptional()
  type?: SessionType = SessionType.INDIVIDUAL;

  @ApiPropertyOptional({ description: 'Notes cliniques — chiffrées AES-256-GCM' })
  @IsString()
  @IsOptional()
  @MaxLength(100000)
  notes?: string;

  @ApiPropertyOptional({ example: ['anxiété', 'relations'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];

  @ApiPropertyOptional({ example: 80 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  rate?: number;

  @ApiPropertyOptional({ enum: TherapyOrientation })
  @IsOptional()
  @IsEnum(TherapyOrientation)
  orientation?: TherapyOrientation;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  templateId?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(5)
  @Max(480)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ enum: SessionType })
  @IsEnum(SessionType)
  @IsOptional()
  type?: SessionType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100000)
  notes?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  rate?: number;

  @ApiPropertyOptional({ enum: SessionPaymentStatus })
  @IsEnum(SessionPaymentStatus)
  @IsOptional()
  paymentStatus?: SessionPaymentStatus;

  @ApiPropertyOptional({ enum: TherapyOrientation })
  @IsOptional()
  @IsEnum(TherapyOrientation)
  orientation?: TherapyOrientation;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Résumé IA (plaintext — chiffré par le backend)' })
  @IsString()
  @IsOptional()
  @MaxLength(100000)
  summaryAi?: string;

  @ApiPropertyOptional({ description: 'Métadonnées IA (evolution, alertes, thèmes)' })
  @IsOptional()
  @IsObject()
  aiMetadata?: Record<string, unknown>;
}

export class SessionQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  to?: string;
}

export class AiSummaryDto {
  @ApiProperty({ description: 'Notes brutes de la séance pour le résumé IA' })
  @IsString()
  rawNotes!: string;

  @ApiPropertyOptional({ description: 'Contexte patient (anonymisé)' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  context?: string;
}
