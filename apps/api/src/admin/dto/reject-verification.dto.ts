import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejectVerificationDto {
  @ApiPropertyOptional({
    example: 'Nom déclaré ne correspond pas au numéro RPPS',
    description: 'Motif du rejet (revue manuelle)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
