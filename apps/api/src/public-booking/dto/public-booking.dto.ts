import { IsString, IsEmail, IsOptional, IsDateString, IsBoolean, IsUUID, MinLength, MaxLength } from 'class-validator';

export class PublicBookingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  patientName!: string;

  @IsEmail()
  patientEmail!: string;

  @IsString()
  @MinLength(6)
  patientPhone!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  payOnline?: boolean;

  @IsOptional()
  @IsUUID()
  consultationTypeId?: string;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}
