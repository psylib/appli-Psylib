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
  @MaxLength(100)
  category!: string; // ExpenseCategory enum value

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subcategory?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  paymentMethod!: string; // ExpensePaymentMethod enum value

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isDeductible?: boolean;
}
