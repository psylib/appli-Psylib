import { IsString, IsEmail, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';

export class PublicBookingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  patientName!: string;

  @IsEmail()
  patientEmail!: string;

  @IsString()
  @IsOptional()
  patientPhone?: string;

  @IsDateString()
  scheduledAt!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
