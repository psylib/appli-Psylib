import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
  MinLength,
  IsObject,
} from 'class-validator';

export class CreateWaitlistEntryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  patientName: string;

  @IsEmail()
  patientEmail: string;

  @IsOptional()
  @IsString()
  patientPhone?: string;

  @IsOptional()
  @IsUUID()
  consultationTypeId?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  urgency?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsObject()
  preferredSlots?: { mornings: boolean; afternoons: boolean; preferredDays: number[] };

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
