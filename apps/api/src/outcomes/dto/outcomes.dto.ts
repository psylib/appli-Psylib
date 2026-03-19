import { IsEnum, IsUUID, IsOptional, IsInt, IsArray, ValidateNested, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AssessmentType } from '@prisma/client';

export class CreateAssessmentDto {
  @IsUUID()
  patientId!: string;

  @IsEnum(AssessmentType)
  type!: AssessmentType;
}

export class AnswerDto {
  @IsString()
  questionId!: string;

  @IsInt()
  @Min(0)
  @Max(3)
  value!: number;
}

export class SubmitAssessmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];
}

export class OutcomesQueryDto {
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @IsEnum(AssessmentType)
  @IsOptional()
  type?: AssessmentType;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
