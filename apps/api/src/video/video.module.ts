import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { RoomServiceClient } from 'livekit-server-sdk';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [VideoController],
  providers: [
    VideoService,
    {
      provide: RoomServiceClient,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('LIVEKIT_API_URL', 'http://localhost:7880');
        const apiKey = config.get<string>('LIVEKIT_API_KEY');
        const apiSecret = config.get<string>('LIVEKIT_API_SECRET');
        return new RoomServiceClient(host, apiKey, apiSecret);
      },
    },
  ],
  exports: [VideoService],
})
export class VideoModule {}
