import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'psy@exemple.fr' })
  @IsEmail()
  email!: string;
}
