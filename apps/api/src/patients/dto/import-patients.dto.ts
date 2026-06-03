import {
  IsArray,
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Une ligne brute issue d'un fichier CSV/Excel, déjà mappée côté navigateur
 * sur les champs PsyLib. Les valeurs restent "brutes" (dates en texte FR, emails
 * potentiellement invalides) — la normalisation/validation fine est faite côté
 * service pour rester tolérant aux exports réels (souvent imparfaits).
 */
export class ImportPatientRowDto {
  @ApiProperty({ example: 'Marie Dupont' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'marie.dupont@email.fr' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({ example: '+33612345678' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: '15/03/1985', description: 'Date brute (DD/MM/YYYY, YYYY-MM-DD…)' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Notes cliniques — chiffrées AES-256-GCM' })
  @IsString()
  @IsOptional()
  @MaxLength(50000)
  notes?: string;

  @ApiPropertyOptional({ example: 'direct' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  source?: string;
}

export class ImportPatientsDto {
  @ApiProperty({ type: [ImportPatientRowDto], description: 'Lignes patients à importer' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => ImportPatientRowDto)
  patients!: ImportPatientRowDto[];
}

export interface ImportPatientsReport {
  total: number;
  imported: number;
  skippedDuplicates: { row: number; name: string; reason: string }[];
  invalid: { row: number; reason: string }[];
  warnings: { row: number; name: string; reason: string }[];
}
