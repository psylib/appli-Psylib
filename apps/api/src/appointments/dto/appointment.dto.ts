import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
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

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @ApiPropertyOptional({ description: 'Mode de paiement', enum: ['none', 'prepayment', 'post_session'] })
  @IsIn(['none', 'prepayment', 'post_session'])
  @IsOptional()
  paymentMode?: 'none' | 'prepayment' | 'post_session';

  @ApiPropertyOptional({ description: 'Montant du paiement en euros', example: 70 })
  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  paymentAmount?: number;
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
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SendPaymentLinkDto {
  @ApiPropertyOptional({ description: 'Override le montant stocké (euros)', example: 70 })
  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  amount?: number;
}
