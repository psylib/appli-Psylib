import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsIn,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultationCategory, ConsultationModality } from '@psyscale/shared-types';

export class CreateConsultationTypeDto {
  @ApiProperty({ example: 'Séance individuelle', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 60, description: 'Durée en minutes (5-480)' })
  @IsInt()
  @Min(5)
  @Max(480)
  duration!: number;

  @ApiProperty({ example: 70, description: 'Tarif en euros (>= 0)' })
  @IsNumber()
  @Min(0)
  rate!: number;

  @ApiPropertyOptional({ example: '#3D52A0', description: 'Couleur hex #XXXXXX' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Le format couleur doit être #XXXXXX' })
  color?: string;

  @ApiPropertyOptional({ enum: ConsultationCategory, default: ConsultationCategory.STANDARD })
  @IsEnum(ConsultationCategory)
  @IsOptional()
  category?: ConsultationCategory;

  @ApiPropertyOptional({ default: true, description: 'Visible en prise de RDV publique' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ enum: ConsultationModality, default: ConsultationModality.ANY, description: 'Modalité de consultation' })
  @IsEnum(ConsultationModality)
  @IsOptional()
  modality?: ConsultationModality;

  @ApiPropertyOptional({ example: '12 rue de la Paix, 75002 Paris', description: 'Lieu spécifique pour ce type' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({ example: 'Merci de vous munir de votre carte vitale', description: 'Instructions pour le patient' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  instructions?: string;

  @ApiPropertyOptional({ enum: ['online', 'on_site', 'both'], description: 'Modes de paiement acceptés (null = hérite du psy)' })
  @IsIn(['online', 'on_site', 'both'])
  @IsOptional()
  allowedPaymentModes?: string;

  @ApiPropertyOptional({ example: 24, description: 'Délai d\'annulation en heures (null = hérite du psy)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  cancellationDelay?: number;
}
