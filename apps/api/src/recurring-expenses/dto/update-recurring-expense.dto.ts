import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateRecurringExpenseDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  label?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  category?: string; // ExpenseCategory enum value

  @IsOptional()
  @IsString()
  paymentMethod?: string; // ExpensePaymentMethod enum value

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  frequency?: string; // 'monthly' | 'quarterly' | 'yearly'

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
