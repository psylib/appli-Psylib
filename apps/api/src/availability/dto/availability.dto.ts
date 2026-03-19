import { IsInt, IsString, IsBoolean, IsOptional, Min, Max, Matches, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilitySlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:MM' })
  startTime!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be HH:MM' })
  endTime!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SaveAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots!: AvailabilitySlotDto[];
}
