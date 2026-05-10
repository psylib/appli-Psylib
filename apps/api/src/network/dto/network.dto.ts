import { IsString, IsBoolean, IsOptional, IsArray, IsEnum, IsUUID, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralStatus, GroupType } from '@prisma/client';

export class UpsertNetworkProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isVisible?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10) department?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) approaches?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) specialties?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() acceptsReferrals?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() offersVisio?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) websiteUrl?: string;
}

export class CreateReferralDto {
  @ApiProperty() @IsUUID() toPsyId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10) patientInitials?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) message?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class UpdateReferralStatusDto {
  @ApiProperty({ enum: ReferralStatus }) @IsEnum(ReferralStatus) status!: ReferralStatus;
}

export class CreateGroupDto {
  @ApiProperty({ enum: GroupType }) @IsEnum(GroupType) type!: GroupType;
  @ApiProperty() @IsString() @MaxLength(200) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) city?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrivate?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxMembers?: number;
}

export class DirectoryQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10) department?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) approach?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) specialty?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) search?: string; // nom
}
