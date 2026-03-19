import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MatchGender { homme = 'homme', femme = 'femme', indifferent = 'indifferent' }

export class MatchQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() problematics?: string;   // "anxiété, burn-out"
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) approaches?: string[]; // ["TCC", "ACT"]
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;     // "54"
  @ApiPropertyOptional() @IsOptional() @IsString() language?: string;       // "fr"
  @ApiPropertyOptional() @IsOptional() @IsEnum(MatchGender) gender?: MatchGender;
}
