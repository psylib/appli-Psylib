import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { BillingModule } from '../billing/billing.module';
import { MonSoutienPsyModule } from '../mon-soutien-psy/mon-soutien-psy.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [BillingModule, MonSoutienPsyModule, InvoicesModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
