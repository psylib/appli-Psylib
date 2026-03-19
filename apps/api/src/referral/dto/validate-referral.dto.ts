import { IsString, Length } from 'class-validator';

export class ValidateReferralDto {
  @IsString()
  @Length(1, 20)
  code!: string;
}
