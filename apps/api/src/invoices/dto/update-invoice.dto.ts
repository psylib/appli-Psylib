import { IsString, IsNumber, IsDateString, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Modification d'une facture — uniquement autorisée tant qu'elle est en BROUILLON.
 * Tous les champs sont optionnels : seuls ceux fournis sont mis à jour.
 */
export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'ID du patient', example: 'uuid-patient' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Montant TTC en euros', example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountTtc?: number;

  @ApiPropertyOptional({ description: 'Date d\'émission (ISO)', example: '2026-03-13' })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;
}
