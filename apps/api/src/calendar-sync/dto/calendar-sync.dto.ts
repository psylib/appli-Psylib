import { IsOptional, IsString } from 'class-validator';

export class CancelSyncDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
