import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { LeadMagnetsController } from './lead-magnets.controller';
import { LeadMagnetsService } from './lead-magnets.service';
import { LeadMagnetPdfService } from './lead-magnet-pdf.service';

@Module({
  imports: [NotificationsModule],
  controllers: [LeadMagnetsController],
  providers: [LeadMagnetsService, LeadMagnetPdfService],
})
export class LeadMagnetsModule {}
