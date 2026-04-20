import {
  IsUUID,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupAppointmentDto {
  @ApiProperty({ description: 'Patient principal (facturé)' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ description: 'Participants additionnels (1-4 patients)' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  participantIds!: string[];

  @ApiProperty({ description: 'Date et heure du RDV' })
  @IsDateString()
  scheduledAt!: string;

  @ApiProperty({ description: 'Durée en minutes', example: 90 })
  @IsInt()
  @Min(15)
  @Max(180)
  duration!: number;

  @ApiPropertyOptional({ description: 'Type de consultation' })
  @IsOptional()
  @IsUUID()
  consultationTypeId?: string;
}
