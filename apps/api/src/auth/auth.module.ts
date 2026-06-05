import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { KeycloakJwtStrategy } from './keycloak-jwt.strategy';
import { KeycloakGuard } from './guards/keycloak.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RppsVerificationService } from './rpps-verification.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'keycloak-jwt' }),
    NotificationsModule,
    BillingModule,
  ],
  controllers: [AuthController],
  providers: [
    KeycloakJwtStrategy,
    KeycloakGuard,
    RolesGuard,
    AuthService,
    RppsVerificationService,
  ],
  exports: [KeycloakGuard, RolesGuard, PassportModule, AuthService],
})
export class AuthModule {}
