import { IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/** Champ multipart : envoyé en "true"/"false" (string) par FormData → coerce. */
export class ImportScribeAudioDto {
  @ApiProperty({ description: "Attestation du consentement du patient à la transcription IA" })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  consentConfirmed!: boolean;
}

export interface SessionScribeStatusResponse {
  status: 'none' | 'processing' | 'done' | 'failed';
  hasNote: boolean;
}
