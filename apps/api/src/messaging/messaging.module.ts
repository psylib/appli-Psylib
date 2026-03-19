import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';

@Module({
  imports: [
    // ConfigService est injecté dans MessagingGateway pour lire KEYCLOAK_URL / KEYCLOAK_REALM
    ConfigModule,
  ],
  controllers: [MessagingController],
  providers: [MessagingGateway, MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
