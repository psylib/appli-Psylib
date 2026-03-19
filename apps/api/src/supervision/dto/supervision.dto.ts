import {
  IsString, IsOptional, IsBoolean, IsInt, IsDateString,
  IsEnum, IsUUID, Min, Max, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum SupervisionGroupTypeDto {
  supervision = 'supervision',
  intervision = 'intervision',
}

export class CreateGroupDto {
  @ApiProperty({ enum: SupervisionGroupTypeDto })
  @IsEnum(SupervisionGroupTypeDto)
  type!: SupervisionGroupTypeDto;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPrivate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(50)
  maxMembers?: number;
}

export class UpdateGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPrivate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(50)
  maxMembers?: number;
}

export class CreateSessionDto {
  @ApiProperty()
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(240)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(240)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({ enum: ['planned', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['planned', 'completed', 'cancelled'])
  status?: 'planned' | 'completed' | 'cancelled';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCaseStudyDto {
  @ApiProperty()
  @IsUUID()
  sessionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  initials?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ageRange?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  problematic!: string;

  @ApiProperty()
  @IsString()
  content!: string;
}
