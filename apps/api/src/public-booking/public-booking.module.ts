import { Module } from '@nestjs/common';
import { PublicBookingController } from './public-booking.controller';
import { PublicBookingService } from './public-booking.service';
import { AvailabilityModule } from '../availability/availability.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [AvailabilityModule, NotificationsModule, BillingModule],
  controllers: [PublicBookingController],
  providers: [PublicBookingService],
})
export class PublicBookingModule {}
