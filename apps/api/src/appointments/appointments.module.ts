import { Module, forwardRef } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentCancelController } from './appointment-cancel.controller';
import { AppointmentsService } from './appointments.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    NotificationsModule,
    forwardRef(() => WaitlistModule),
    forwardRef(() => BillingModule),
  ],
  controllers: [AppointmentsController, AppointmentCancelController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
