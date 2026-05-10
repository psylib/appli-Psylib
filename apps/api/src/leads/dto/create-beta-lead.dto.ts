import { IsEmail, IsOptional, IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class CreateBetaLeadDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{9}$/, { message: 'Numéro ADELI invalide (9 chiffres)' })
  adeli?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  message?: string;

  @IsString()
  @IsOptional()
  @MaxLength(45)
  ip?: string;
}
