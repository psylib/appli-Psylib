import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { ScribeService } from './scribe.service';
import { ScribeProcessor, SCRIBE_QUEUE } from './scribe.processor';
import { RoomServiceClient } from 'livekit-server-sdk';
import { BillingModule } from '../billing/billing.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BillingModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: SCRIBE_QUEUE,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 20,
      },
    }),
  ],
  controllers: [VideoController],
  providers: [
    VideoService,
    ScribeService,
    ScribeProcessor,
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
