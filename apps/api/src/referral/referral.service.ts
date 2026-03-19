import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(private readonly prisma: PrismaService) {}

  private generateCode(name: string): string {
    const prefix = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 6) || 'PSY';
    const suffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, 'X');
    return `${prefix}-${suffix}`;
  }

  async getOrCreateCode(userId: string): Promise<{ code: string }> {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    // Check if already has a code
    const existing = await this.prisma.referralInvite.findFirst({
      where: { referrerId: psy.id, referredId: null, status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
    if (existing) return { code: existing.code };

    // Generate unique code
    let code = this.generateCode(psy.name);
    let attempts = 0;
    while (attempts < 5) {
      const conflict = await this.prisma.referralInvite.findUnique({ where: { code } });
      if (!conflict) break;
      code = this.generateCode(psy.name);
      attempts++;
    }

    const invite = await this.prisma.referralInvite.create({
      data: { code, referrerId: psy.id },
    });
    return { code: invite.code };
  }

  async getStats(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const sent = await this.prisma.referralInvite.count({ where: { referrerId: psy.id } });
    const converted = await this.prisma.referralInvite.count({
      where: { referrerId: psy.id, status: { in: ['used', 'rewarded'] } },
    });
    const rewardsPending = await this.prisma.referralInvite.count({
      where: { referrerId: psy.id, status: 'used', rewardGivenAt: null },
    });

    return { sent, converted, rewardsPending };
  }

  async validateCode(userId: string, code: string): Promise<{ success: boolean }> {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const invite = await this.prisma.referralInvite.findUnique({ where: { code } });
    if (!invite) throw new BadRequestException('Code de parrainage invalide');
    if (invite.status !== 'pending') throw new BadRequestException('Ce code a déjà été utilisé');
    if (invite.referrerId === psy.id) throw new BadRequestException('Vous ne pouvez pas utiliser votre propre code');

    // Check psy hasn't already been referred
    const alreadyReferred = await this.prisma.referralInvite.findFirst({
      where: { referredId: psy.id },
    });
    if (alreadyReferred) throw new BadRequestException('Vous avez déjà utilisé un code de parrainage');

    await this.prisma.referralInvite.update({
      where: { id: invite.id },
      data: { referredId: psy.id, status: 'used' },
    });

    this.logger.log(`Referral validated: code=${code} referrer=${invite.referrerId} referred=${psy.id}`);
    return { success: true };
  }

  async applyRewardForReferrer(referralCode: string): Promise<string | null> {
    const invite = await this.prisma.referralInvite.findUnique({ where: { code: referralCode } });
    if (!invite || invite.status !== 'used') return null;

    await this.prisma.referralInvite.update({
      where: { id: invite.id },
      data: { status: 'rewarded', rewardGivenAt: new Date() },
    });

    // Return the referrer's stripeSubscriptionId for trial extension
    const sub = await this.prisma.subscription.findUnique({
      where: { psychologistId: invite.referrerId },
    });
    return sub?.stripeSubscriptionId ?? null;
  }
}
