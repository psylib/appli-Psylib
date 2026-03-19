import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TherapyOrientation } from '@prisma/client';

export class TemplateSectionDto {
  @ApiProperty() @IsString() id!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() placeholder!: string;
  @ApiProperty() @IsBoolean() required!: boolean;
}

export class CreateNoteTemplateDto {
  @ApiProperty({ enum: TherapyOrientation }) @IsEnum(TherapyOrientation) orientation!: TherapyOrientation;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ type: [TemplateSectionDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => TemplateSectionDto) sections!: TemplateSectionDto[];
}

export class UpdateNoteTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ type: [TemplateSectionDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TemplateSectionDto) sections?: TemplateSectionDto[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
