import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  ip?: string;
}
