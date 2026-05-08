import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GuardianRelationship } from '@psyscale/shared-types';
import { GuardianPermissionsDto } from './create-guardian.dto';

export class UpdateGuardianDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: GuardianRelationship })
  @IsEnum(GuardianRelationship)
  @IsOptional()
  relationship?: GuardianRelationship;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  permissions?: GuardianPermissionsDto;
}
