import { IsIn, IsString, MaxLength } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @MaxLength(500)
  token!: string;

  @IsIn(['ios', 'android'])
  platform!: 'ios' | 'android';
}
