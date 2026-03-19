import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
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
  @IsString()
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
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
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
