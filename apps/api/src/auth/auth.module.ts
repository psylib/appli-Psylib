import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { KeycloakJwtStrategy } from './keycloak-jwt.strategy';
import { KeycloakGuard } from './guards/keycloak.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'keycloak-jwt' }),
  ],
  controllers: [AuthController],
  providers: [KeycloakJwtStrategy, KeycloakGuard, RolesGuard],
  exports: [KeycloakGuard, RolesGuard, PassportModule],
})
export class AuthModule {}
