import { Module } from '@nestjs/common';
import { AssistantsService } from './assistants.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, NotificationsModule],
  providers: [AssistantsService],
  exports: [AssistantsService],
})
export class AssistantsModule {}
