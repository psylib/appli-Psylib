import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultationCategory } from '@psyscale/shared-types';

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
}
