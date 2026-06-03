import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan, type BillingInterval } from '@psyscale/shared-types';

export class CreateCheckoutDto {
  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.PRO })
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;

  @ApiPropertyOptional({ enum: ['month', 'year'], example: 'month' })
  @IsIn(['month', 'year'])
  @IsOptional()
  interval?: BillingInterval;

  @ApiPropertyOptional({ example: 'MARIE-X7K2' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  referralCode?: string;
}
