import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceGenerationProcessor, INVOICE_GENERATION_QUEUE } from './invoice-generation.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    BullModule.registerQueue({
      name: INVOICE_GENERATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    }),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceGenerationProcessor],
  exports: [InvoicesService, BullModule],
})
export class InvoicesModule {}
