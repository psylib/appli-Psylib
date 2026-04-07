import { Module } from '@nestjs/common';
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
      useFactory: () => {
        const host = process.env.LIVEKIT_API_URL || 'http://localhost:7880';
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        return new RoomServiceClient(host, apiKey, apiSecret);
      },
    },
  ],
  exports: [VideoService],
})
export class VideoModule {}
