import { IsEmail, IsString, MinLength, MaxLength, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ example: 'abc123token' })
  @IsString()
  @MaxLength(500)
  token!: string;

  @ApiProperty({ example: 'MonMotDePasse!1' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ description: 'Consentement traitement IA (RGPD opt-in)' })
  @IsBoolean()
  @IsOptional()
  consentAi?: boolean;
}

export class PatientLoginDto {
  @ApiProperty({ example: 'patient@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'MonMotDePasse!1' })
  @IsString()
  @MaxLength(128)
  password!: string;
}
