import { IsIn, IsString } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  token!: string;

  @IsIn(['ios', 'android'])
  platform!: 'ios' | 'android';
}
