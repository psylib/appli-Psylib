import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from './sms-provider.interface';

@Injectable()
export class StubSmsProvider implements SmsProvider {
  private readonly logger = new Logger(StubSmsProvider.name);

  async sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    this.logger.log(`[STUB SMS] To: ${to} — Message: ${message.substring(0, 80)}...`);
    return { success: true, messageId: `stub-${Date.now()}` };
  }
}
