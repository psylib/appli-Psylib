import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'psy@exemple.fr' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Marie' })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiProperty({ example: '149300121', description: 'Numéro ADELI ou RPPS' })
  @IsString()
  @Matches(/^[0-9\s]{8,15}$/, {
    message: 'Numéro ADELI (9 chiffres) ou RPPS (11 chiffres) invalide',
  })
  adeliOrRpps!: string;
}
