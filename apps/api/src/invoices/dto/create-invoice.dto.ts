import { IsString, IsArray, IsNumber, IsDateString, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID du patient', example: 'uuid-patient' })
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({ description: 'IDs des séances incluses', type: [String] })
  @IsArray()
  @IsString({ each: true })
  sessions!: string[];

  @ApiProperty({ description: 'Montant TTC en euros', example: 150 })
  @IsNumber()
  @Min(0)
  amountTtc!: number;

  @ApiProperty({ description: 'Date d\'émission (ISO)', example: '2026-03-13' })
  @IsDateString()
  issuedAt!: string;
}
