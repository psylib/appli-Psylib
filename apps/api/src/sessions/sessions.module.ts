import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { BillingModule } from '../billing/billing.module';
import { MonSoutienPsyModule } from '../mon-soutien-psy/mon-soutien-psy.module';

@Module({
  imports: [BillingModule, MonSoutienPsyModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
