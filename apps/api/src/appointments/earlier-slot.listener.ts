import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EarlierSlotService } from './earlier-slot.service';

interface SlotFreedEvent {
  psychologistId: string;
  freedAt: Date;
}

@Injectable()
export class EarlierSlotListener {
  private readonly logger = new Logger(EarlierSlotListener.name);

  constructor(private readonly earlierSlot: EarlierSlotService) {}

  @OnEvent('slot.freed')
  async handleSlotFreed(event: SlotFreedEvent): Promise<void> {
    try {
      await this.earlierSlot.notifyFreedSlot(event.psychologistId, new Date(event.freedAt));
    } catch (err) {
      this.logger.error(
        `handleSlotFreed failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
