import { IsDateString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimeslotsQueryDto {
  @ApiProperty({ description: 'Start date (ISO)', example: '2026-05-13' })
  @IsDateString()
  from!: string;

  @ApiProperty({ description: 'End date (ISO)', example: '2026-06-12' })
  @IsDateString()
  to!: string;

  @ApiPropertyOptional({ description: 'Session duration in minutes', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(15)
  @Max(480)
  duration?: number;
}
