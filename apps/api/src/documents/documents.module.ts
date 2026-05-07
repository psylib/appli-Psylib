import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [BillingModule, NotificationsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
