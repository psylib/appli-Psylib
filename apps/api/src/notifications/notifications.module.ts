import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailSequenceService } from './email-sequence.service';

@Module({
  controllers: [NotificationsController],
  providers: [EmailService, SmsService, NotificationsService, EmailSequenceService],
  exports: [EmailService, SmsService, NotificationsService],
})
export class NotificationsModule {}
