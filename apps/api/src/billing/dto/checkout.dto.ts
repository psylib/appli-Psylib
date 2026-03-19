import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan } from '@psyscale/shared-types';

export class CreateCheckoutDto {
  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.PRO })
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;

  @ApiPropertyOptional({ example: 'MARIE-X7K2' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  referralCode?: string;
}
