import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GuardianJwtStrategy } from './strategies/guardian-jwt.strategy';
import { GuardianAuthController } from './guardian-auth.controller';
import { GuardianAuthService } from './guardian-auth.service';
import { GuardianPortalController } from './guardian-portal.controller';
import { GuardianPortalService } from './guardian-portal.service';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [GuardianAuthController, GuardianPortalController],
  providers: [GuardianJwtStrategy, GuardianAuthService, GuardianPortalService],
})
export class GuardianPortalModule {}
