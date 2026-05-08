import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { KeycloakJwtStrategy } from './keycloak-jwt.strategy';
import { KeycloakGuard } from './guards/keycloak.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'keycloak-jwt' }),
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [KeycloakJwtStrategy, KeycloakGuard, RolesGuard, AuthService],
  exports: [KeycloakGuard, RolesGuard, PassportModule],
})
export class AuthModule {}
