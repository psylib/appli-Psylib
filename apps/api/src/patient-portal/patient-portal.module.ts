import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PatientJwtStrategy } from './strategies/patient-jwt.strategy';
import { PatientAuthController } from './patient-auth.controller';
import { PatientAuthService } from './patient-auth.service';
import { PatientPortalController } from './patient-portal.controller';
import { PatientPortalService } from './patient-portal.service';
import { PatientInvitationService } from './patient-invitation.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScoringService } from '../outcomes/scoring.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // secret injecté dynamiquement via ConfigService
    NotificationsModule,
  ],
  controllers: [PatientAuthController, PatientPortalController],
  providers: [
    PatientJwtStrategy,
    PatientAuthService,
    PatientPortalService,
    PatientInvitationService,
    ScoringService,
  ],
  exports: [PatientInvitationService],
})
export class PatientPortalModule {}
