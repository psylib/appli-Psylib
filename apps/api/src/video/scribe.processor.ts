import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ScribeService } from './scribe.service';

export const SCRIBE_QUEUE = 'scribe-processing';

export interface ScribeJobData {
  videoRoomId: string;
  audioFilePath: string;
}

@Processor(SCRIBE_QUEUE, { concurrency: 2 })
export class ScribeProcessor extends WorkerHost {
  private readonly logger = new Logger(ScribeProcessor.name);

  constructor(private readonly scribeService: ScribeService) {
    super();
  }

  async process(job: Job<ScribeJobData>): Promise<void> {
    const { videoRoomId, audioFilePath } = job.data;
    this.logger.log(`Processing scribe job for room ${videoRoomId}`);
    await this.scribeService.processScribeJob(videoRoomId, audioFilePath);
  }
}
