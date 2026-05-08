import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuardianRelationship } from '@psyscale/shared-types';

export class GuardianPermissionsDto {
  @IsBoolean()
  portal!: boolean;

  @IsBoolean()
  invoices!: boolean;

  @IsBoolean()
  video!: boolean;

  @IsBoolean()
  documents!: boolean;

  @IsBoolean()
  messaging!: boolean;
}

export class CreateGuardianDto {
  @ApiProperty({ example: 'Marie Dupont' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'marie.dupont@email.fr' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+33612345678' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ enum: GuardianRelationship })
  @IsEnum(GuardianRelationship)
  relationship!: GuardianRelationship;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => GuardianPermissionsDto)
  permissions?: GuardianPermissionsDto;
}
