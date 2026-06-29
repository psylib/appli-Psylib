import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BillingModule } from '../billing/billing.module';
import { SCRIBE_QUEUE } from '../video/scribe.processor';
import { SessionScribeController } from './session-scribe.controller';
import { SessionScribeService } from './session-scribe.service';

@Module({
  imports: [
    BillingModule,
    // Producer-only : le worker (ScribeProcessor) vit dans VideoModule et traite
    // les jobs quelle que soit leur origine (même nom de queue Redis).
    BullModule.registerQueue({ name: SCRIBE_QUEUE }),
  ],
  controllers: [SessionScribeController],
  providers: [SessionScribeService],
})
export class SessionScribeModule {}
