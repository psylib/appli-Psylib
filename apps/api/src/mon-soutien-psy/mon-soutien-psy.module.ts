import { Module } from '@nestjs/common';
import { MonSoutienPsyService } from './mon-soutien-psy.service';
import { MonSoutienPsyController } from './mon-soutien-psy.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [MonSoutienPsyController],
  providers: [MonSoutienPsyService],
  exports: [MonSoutienPsyService],
})
export class MonSoutienPsyModule {}
