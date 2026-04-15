import {
  IsString,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateRecurringExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  label!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  category!: string; // ExpenseCategory enum value

  @IsString()
  @IsNotEmpty()
  paymentMethod!: string; // ExpensePaymentMethod enum value

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsString()
  @IsNotEmpty()
  frequency!: string; // 'monthly' | 'quarterly' | 'yearly'

  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth!: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
