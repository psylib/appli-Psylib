import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TherapyOrientation } from '@prisma/client';

export class TemplateSectionDto {
  @ApiProperty() @IsString() @MaxLength(100) id!: string;
  @ApiProperty() @IsString() @MaxLength(200) title!: string;
  @ApiProperty() @IsString() @MaxLength(500) placeholder!: string;
  @ApiProperty() @IsBoolean() required!: boolean;
}

export class CreateNoteTemplateDto {
  @ApiProperty({ enum: TherapyOrientation }) @IsEnum(TherapyOrientation) orientation!: TherapyOrientation;
  @ApiProperty() @IsString() @MaxLength(200) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @ApiProperty({ type: [TemplateSectionDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => TemplateSectionDto) sections!: TemplateSectionDto[];
}

export class UpdateNoteTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @ApiPropertyOptional({ type: [TemplateSectionDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TemplateSectionDto) sections?: TemplateSectionDto[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
