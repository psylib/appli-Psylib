import { Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { StubSmsProvider } from './stub-sms.provider';
import { SMS_PROVIDER } from './sms-provider.interface';

@Module({
  imports: [NotificationsModule],
  providers: [
    ReminderService,
    { provide: SMS_PROVIDER, useClass: StubSmsProvider },
  ],
  exports: [ReminderService],
})
export class ReminderModule {}
