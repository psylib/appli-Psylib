import { Module } from '@nestjs/common';
import { ExpensesModule } from '../expenses/expenses.module';
import { BillingModule } from '../billing/billing.module';
import { RecurringExpensesController } from './recurring-expenses.controller';
import { RecurringExpensesService } from './recurring-expenses.service';
import { RecurringExpensesCron } from './recurring-expenses.cron';

@Module({
  imports: [ExpensesModule, BillingModule],
  controllers: [RecurringExpensesController],
  providers: [RecurringExpensesService, RecurringExpensesCron],
  exports: [RecurringExpensesService],
})
export class RecurringExpensesModule {}
