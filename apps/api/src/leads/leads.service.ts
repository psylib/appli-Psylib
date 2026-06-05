import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * RGPD (audit 2026-06-05) : Lead.ip est une PII à anonymiser après 30 jours
   * (rétention documentée dans le schéma). Cron quotidien à 03:00.
   */
  @Cron('0 3 * * *')
  async purgeOldLeadIps(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const res = await this.prisma.lead.updateMany({
      where: { ip: { not: null }, createdAt: { lt: cutoff } },
      data: { ip: null },
    });
    if (res.count > 0) {
      this.logger.log(`Anonymized ${res.count} lead IP(s) older than 30 days (RGPD)`);
    }
  }

  async upsert(dto: CreateLeadDto) {
    return this.prisma.lead.upsert({
      where: { email: dto.email },
      update: {},
      create: {
        email: dto.email,
        source: dto.source ?? 'landing_beta',
        ip: dto.ip ?? null,
      },
      select: { id: true, email: true, source: true, createdAt: true },
    });
  }
}
