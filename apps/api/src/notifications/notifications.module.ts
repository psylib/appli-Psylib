import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailSequenceService } from './email-sequence.service';
import { PushService } from './push.service';

@Module({
  controllers: [NotificationsController],
  providers: [EmailService, SmsService, NotificationsService, EmailSequenceService, PushService],
  exports: [EmailService, SmsService, NotificationsService, PushService],
})
export class NotificationsModule {}
