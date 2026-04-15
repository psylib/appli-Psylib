import {
  IsString,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateExpenseDto {
  @IsDateString()
  date!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  label!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountHt?: number;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsString()
  @IsNotEmpty()
  category!: string; // ExpenseCategory enum value

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod!: string; // ExpensePaymentMethod enum value

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isDeductible?: boolean;
}
