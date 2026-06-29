import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ScribeService } from './scribe.service';

export const SCRIBE_QUEUE = 'scribe-processing';

export interface ScribeJobData {
  /** Pipeline visio (room → session liée). */
  videoRoomId?: string;
  /** Pipeline import audio attaché directement à une séance (présentiel). */
  sessionId?: string;
  audioFilePath: string;
}

@Processor(SCRIBE_QUEUE, { concurrency: 2 })
export class ScribeProcessor extends WorkerHost {
  private readonly logger = new Logger(ScribeProcessor.name);

  constructor(private readonly scribeService: ScribeService) {
    super();
  }

  async process(job: Job<ScribeJobData>): Promise<void> {
    const { videoRoomId, sessionId, audioFilePath } = job.data;

    if (sessionId) {
      this.logger.log(`Processing scribe job for session ${sessionId}`);
      await this.scribeService.processSessionScribeJob(sessionId, audioFilePath);
      return;
    }

    if (videoRoomId) {
      this.logger.log(`Processing scribe job for room ${videoRoomId}`);
      await this.scribeService.processScribeJob(videoRoomId, audioFilePath);
      return;
    }

    this.logger.error(`Scribe job ${job.id} sans videoRoomId ni sessionId — ignoré`);
  }
}
