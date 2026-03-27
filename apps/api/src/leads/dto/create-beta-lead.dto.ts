import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateBetaLeadDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{9}$/, { message: 'Numéro ADELI invalide (9 chiffres)' })
  adeli?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  ip?: string;
}
