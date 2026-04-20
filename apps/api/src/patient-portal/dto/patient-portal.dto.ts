import { IsInt, Min, Max, IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMoodDto {
  @ApiProperty({ example: 7, description: 'Humeur de 1 à 10' })
  @IsInt()
  @Min(1)
  @Max(10)
  mood!: number;

  @ApiPropertyOptional({ example: 'Journée difficile au travail' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ example: 'Aujourd\'hui j\'ai remarqué que...' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ example: 6 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  mood?: number;

  @ApiPropertyOptional({ example: ['anxiété', 'travail'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}

export class UpdateExerciseDto {
  @ApiProperty({ enum: ['in_progress', 'completed', 'skipped'] })
  @IsString()
  status!: 'in_progress' | 'completed' | 'skipped';

  @ApiPropertyOptional({ example: 'J\'ai trouvé cet exercice très utile' })
  @IsString()
  @IsOptional()
  patientFeedback?: string;
}
