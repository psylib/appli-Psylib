import { IsEmail, IsString, MinLength, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ example: 'abc123token' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'MonMotDePasse!1' })
  @IsString()
  @MinLength(8)
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
  password!: string;
}
