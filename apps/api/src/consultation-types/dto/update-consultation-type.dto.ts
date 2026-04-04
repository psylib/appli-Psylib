import {
  IsOptional,
  IsBoolean,
  IsInt,
  IsString,
  IsNumber,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultationCategory } from '@psyscale/shared-types';

export class UpdateConsultationTypeDto {
  @ApiPropertyOptional({ example: 'Séance individuelle', minLength: 2, maxLength: 100 })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 60, description: 'Durée en minutes (5-480)' })
  @IsInt()
  @IsOptional()
  @Min(5)
  @Max(480)
  duration?: number;

  @ApiPropertyOptional({ example: 70, description: 'Tarif en euros (>= 0)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  rate?: number;

  @ApiPropertyOptional({ example: '#3D52A0', description: 'Couleur hex #XXXXXX' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Le format couleur doit être #XXXXXX' })
  color?: string;

  @ApiPropertyOptional({ enum: ConsultationCategory })
  @IsEnum(ConsultationCategory)
  @IsOptional()
  category?: ConsultationCategory;

  @ApiPropertyOptional({ description: 'Visible en prise de RDV publique' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Actif / inactif' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Ordre de tri (>= 0)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}
