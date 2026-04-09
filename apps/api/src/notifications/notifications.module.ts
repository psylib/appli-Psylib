import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailSequenceService } from './email-sequence.service';
import { LeadNurtureSequenceService } from './lead-nurture-sequence.service';
import { PushService } from './push.service';
import { NotificationGateway } from './notification.gateway';

@Module({
  controllers: [NotificationsController],
  providers: [EmailService, SmsService, NotificationsService, EmailSequenceService, LeadNurtureSequenceService, PushService, NotificationGateway],
  exports: [EmailService, SmsService, NotificationsService, LeadNurtureSequenceService, PushService, NotificationGateway],
})
export class NotificationsModule {}
