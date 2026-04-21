import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientStatus } from '@psyscale/shared-types';

export class CreatePatientDto {
  @ApiProperty({ example: 'Marie Dupont' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'marie.dupont@email.fr' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+33612345678' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '1985-03-15' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Notes cliniques — chiffrées AES-256-GCM' })
  @IsString()
  @IsOptional()
  @MaxLength(50000)
  notes?: string;

  @ApiPropertyOptional({ enum: ['direct', 'referral', 'online'] })
  @IsIn(['direct', 'referral', 'online'])
  @IsOptional()
  source?: string;
}

export class UpdatePatientDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50000)
  notes?: string;

  @ApiPropertyOptional({ enum: PatientStatus })
  @IsEnum(PatientStatus)
  @IsOptional()
  status?: PatientStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  source?: string;
}

export class PatientQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: PatientStatus })
  @IsEnum(PatientStatus)
  @IsOptional()
  status?: PatientStatus;
}

export class CreateExerciseDto {
  @ApiProperty({ example: 'Respiration 4-7-8' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Inspirez pendant 4 secondes...' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({ example: '2026-04-20' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  createdByAi!: boolean;
}
