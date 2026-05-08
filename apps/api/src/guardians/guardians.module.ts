import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GuardiansController } from './guardians.controller';
import { GuardiansService } from './guardians.service';
import { GuardianInvitationsController } from './guardian-invitations.controller';
import { GuardianInvitationsService } from './guardian-invitations.service';
import { GuardianConsentsController } from './guardian-consents.controller';
import { GuardianConsentsService } from './guardian-consents.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [
    GuardiansController,
    GuardianInvitationsController,
    GuardianConsentsController,
  ],
  providers: [GuardiansService, GuardianInvitationsService, GuardianConsentsService],
  exports: [GuardiansService],
})
export class GuardiansModule {}
