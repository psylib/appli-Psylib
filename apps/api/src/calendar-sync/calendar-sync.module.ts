import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CalendarSyncService } from './calendar-sync.service';
import { GoogleCalendarProvider } from './google-calendar.provider';
import { CalendarSyncProcessor } from './calendar-sync.processor';
import { CALENDAR_SYNC_QUEUE } from './calendar-sync.constants';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingModule } from '../billing/billing.module';

// CalendarSyncController will be added when the controller file is created (Task 7)

@Module({
  imports: [
    BullModule.registerQueue({
      name: CALENDAR_SYNC_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    }),
    CommonModule,
    NotificationsModule,
    BillingModule,
  ],
  providers: [
    CalendarSyncService,
    GoogleCalendarProvider,
    CalendarSyncProcessor,
  ],
  exports: [CalendarSyncService],
})
export class CalendarSyncModule {}
