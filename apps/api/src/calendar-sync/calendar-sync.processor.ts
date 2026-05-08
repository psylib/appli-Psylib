import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CalendarSyncService } from './calendar-sync.service';
import { CALENDAR_SYNC_QUEUE } from './calendar-sync.constants';

interface SyncJobData {
  psychologistId: string;
}

@Processor(CALENDAR_SYNC_QUEUE, { concurrency: 2 })
export class CalendarSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CalendarSyncProcessor.name);

  constructor(private readonly syncService: CalendarSyncService) {
    super();
  }

  async process(job: Job<SyncJobData>): Promise<void> {
    const { psychologistId } = job.data;

    switch (job.name) {
      case 'initial-sync': {
        this.logger.log(`Initial sync for psy ${psychologistId}`);
        try {
          await this.syncService.performIncrementalSync(psychologistId);
          await this.syncService.setupWatch(psychologistId);
        } catch (err) {
          this.logger.error(`Initial sync failed for psy ${psychologistId}`, err);
          throw err;
        }
        break;
      }
      case 'incremental-sync': {
        this.logger.debug(`Incremental sync for psy ${psychologistId}`);
        try {
          await this.syncService.performIncrementalSync(psychologistId);
        } catch (err) {
          this.logger.error(`Incremental sync failed for psy ${psychologistId}`, err);
          throw err;
        }
        break;
      }
      case 'poll-all': {
        this.logger.debug('Polling all active calendar connections');
        const psyIds = await this.syncService.getActiveConnectionIds();
        for (const psyId of psyIds) {
          try {
            await this.syncService.performIncrementalSync(psyId);
          } catch (err) {
            this.logger.error(`Poll sync failed for psy ${psyId}`, err);
          }
        }
        await this.syncService.renewExpiringWatches();
        break;
      }
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
