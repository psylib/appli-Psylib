import { IsEmail, IsIn, IsString } from 'class-validator';

export class RequestLeadMagnetDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsIn(['kit-demarrage-cabinet', 'templates-notes-tcc', 'guide-tarifs-facturation'])
  slug!: string;
}
