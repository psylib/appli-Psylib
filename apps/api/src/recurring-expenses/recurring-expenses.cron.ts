import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RecurringExpensesService } from './recurring-expenses.service';

@Injectable()
export class RecurringExpensesCron {
  private readonly logger = new Logger(RecurringExpensesCron.name);

  constructor(private readonly recurringService: RecurringExpensesService) {}

  @Cron('0 2 * * *', { timeZone: 'Europe/Paris' })
  async handleCron() {
    this.logger.log('Running recurring expenses generation...');
    const result = await this.recurringService.generateDueExpenses();
    this.logger.log(`Generated ${result.created} expenses, skipped ${result.skipped}`);
  }
}
