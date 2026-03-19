import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailSequenceService } from './email-sequence.service';

@Module({
  controllers: [NotificationsController],
  providers: [EmailService, NotificationsService, EmailSequenceService],
  exports: [EmailService, NotificationsService],
})
export class NotificationsModule {}
