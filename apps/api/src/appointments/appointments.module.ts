import { Module, forwardRef } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentCancelController } from './appointment-cancel.controller';
import { AppointmentsService } from './appointments.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { BillingModule } from '../billing/billing.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { AvailabilityModule } from '../availability/availability.module';
import { EarlierSlotService } from './earlier-slot.service';
import { EarlierSlotListener } from './earlier-slot.listener';

@Module({
  imports: [
    NotificationsModule,
    forwardRef(() => WaitlistModule),
    forwardRef(() => BillingModule),
    forwardRef(() => InvoicesModule),
    AvailabilityModule,
  ],
  controllers: [AppointmentsController, AppointmentCancelController],
  providers: [AppointmentsService, EarlierSlotService, EarlierSlotListener],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
