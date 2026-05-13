import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsIn,
  IsUUID,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus, OfflinePaymentMethod } from '@psyscale/shared-types';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
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

  @ApiPropertyOptional({ description: 'Motif ou notes préliminaires' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  reason?: string;
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

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @ApiPropertyOptional({ description: 'Mode de paiement sur place', enum: OfflinePaymentMethod })
  @IsEnum(OfflinePaymentMethod)
  @IsOptional()
  offlinePaymentMethod?: OfflinePaymentMethod;

  @ApiPropertyOptional({ description: 'Raison de l\'annulation' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  cancellationReason?: string;
}

export class CancelAppointmentDto {
  @ApiPropertyOptional({ description: 'Raison de l\'annulation' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  cancellationReason?: string;
}

export class MarkPaidOnSiteDto {
  @ApiProperty({ description: 'Mode de paiement sur place', enum: OfflinePaymentMethod })
  @IsEnum(OfflinePaymentMethod)
  offlinePaymentMethod!: OfflinePaymentMethod;
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
