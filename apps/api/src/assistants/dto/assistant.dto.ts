import { IsEmail, IsString, MinLength } from 'class-validator';

export class InviteAssistantDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;
}

export class AcceptAssistantInvitationDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
