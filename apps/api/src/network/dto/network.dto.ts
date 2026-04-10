import { IsString, IsBoolean, IsOptional, IsArray, IsEnum, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralStatus, GroupType } from '@prisma/client';

export class UpsertNetworkProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isVisible?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) approaches?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) specialties?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() acceptsReferrals?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() offersVisio?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() websiteUrl?: string;
}

export class CreateReferralDto {
  @ApiProperty() @IsUUID() toPsyId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() patientInitials?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class UpdateReferralStatusDto {
  @ApiProperty({ enum: ReferralStatus }) @IsEnum(ReferralStatus) status!: ReferralStatus;
}

export class CreateGroupDto {
  @ApiProperty({ enum: GroupType }) @IsEnum(GroupType) type!: GroupType;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrivate?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxMembers?: number;
}

export class DirectoryQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() approach?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() specialty?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string; // nom
}
