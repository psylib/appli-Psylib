import { IsUUID, IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentCategoryDto {
  EXERCISE = 'exercise',
  ADMINISTRATIVE = 'administrative',
  SESSION_REPORT = 'session_report',
  OTHER = 'other',
}

export class ShareDocumentDto {
  @ApiProperty({ example: 'uuid-of-patient' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ enum: DocumentCategoryDto })
  @IsEnum(DocumentCategoryDto)
  category!: DocumentCategoryDto;

  @ApiPropertyOptional({ example: 'Voici la fiche de relaxation' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  message?: string;
}
