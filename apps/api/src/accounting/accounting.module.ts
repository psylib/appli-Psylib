import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { BillingModule } from '../billing/billing.module';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { FecExportService } from './fec-export.service';
import { TaxPrepService } from './tax-prep.service';

@Module({
  imports: [CommonModule, BillingModule],
  controllers: [AccountingController],
  providers: [AccountingService, FecExportService, TaxPrepService],
  exports: [AccountingService],
})
export class AccountingModule {}
