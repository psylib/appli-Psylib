import { Module } from '@nestjs/common';
import { RebookController } from './rebook.controller';
import { RebookService } from './rebook.service';
import { AvailabilityModule } from '../availability/availability.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AvailabilityModule, NotificationsModule],
  controllers: [RebookController],
  providers: [RebookService],
})
export class RebookModule {}
