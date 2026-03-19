import { IsEmail, IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ example: 'abc123token' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'MonMotDePasse!1' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class PatientLoginDto {
  @ApiProperty({ example: 'patient@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'MonMotDePasse!1' })
  @IsString()
  password!: string;
}
