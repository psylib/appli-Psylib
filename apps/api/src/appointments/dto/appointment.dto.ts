import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@psyscale/shared-types';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiProperty()
  @IsDateString()
  scheduledAt!: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(5)
  @Max(480)
  duration!: number;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;
}

export class AppointmentQueryDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}
