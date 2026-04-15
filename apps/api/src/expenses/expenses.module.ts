import { Module } from '@nestjs/common';
import { AccountingModule } from '../accounting/accounting.module';
import { BillingModule } from '../billing/billing.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [AccountingModule, BillingModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
