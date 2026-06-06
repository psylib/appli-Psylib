import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Res,
  Headers,
  UseGuards,
  HttpCode,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CalendarSyncService } from './calendar-sync.service';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePlan } from '../billing/decorators/require-plan.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionPlan } from '@psyscale/shared-types';
import { PrismaService } from '../common/prisma.service';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@Controller('calendar-sync')
export class CalendarSyncController {
  private readonly logger = new Logger(CalendarSyncController.name);

  constructor(
    private readonly calendarSyncService: CalendarSyncService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('google/auth')
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.SOLO, SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async startAuth(@CurrentUser() user: KeycloakUser): Promise<{ url: string }> {
    const psy = await this.prisma.psychologist.findUniqueOrThrow({
      where: { userId: user.sub },
    });
    const url = this.calendarSyncService.getAuthUrl(psy.id);
    return { url };
  }

  @Get('google/callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';

    // Validate required params before processing
    if (!code || !state || typeof code !== 'string' || typeof state !== 'string' || code.length > 2048 || state.length > 2048) {
      this.logger.warn('Google Calendar OAuth callback: missing or invalid code/state params');
      res.redirect(`${frontendUrl}/dashboard/settings/practice?calendar=error`);
      return;
    }

    try {
      const { psychologistId } = this.calendarSyncService.verifyState(state);

      // Verify the psychologist exists before proceeding
      const psy = await this.prisma.psychologist.findUnique({
        where: { id: psychologistId },
        select: { id: true },
      });
      if (!psy) {
        this.logger.warn(`Google Calendar OAuth callback: psychologist ${psychologistId} not found`);
        res.redirect(`${frontendUrl}/dashboard/settings/practice?calendar=error`);
        return;
      }

      await this.calendarSyncService.handleCallback(psychologistId, code);
      res.redirect(`${frontendUrl}/dashboard/settings/practice?calendar=connected`);
    } catch (err) {
      this.logger.error('Google Calendar OAuth callback failed', err);
      res.redirect(`${frontendUrl}/dashboard/settings/practice?calendar=error`);
    }
  }

  @Get('status')
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async getStatus(@CurrentUser() user: KeycloakUser) {
    const psy = await this.prisma.psychologist.findUniqueOrThrow({
      where: { userId: user.sub },
    });
    return this.calendarSyncService.getStatus(psy.id);
  }

  @Delete('disconnect')
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async disconnect(@CurrentUser() user: KeycloakUser) {
    const psy = await this.prisma.psychologist.findUniqueOrThrow({
      where: { userId: user.sub },
    });
    await this.calendarSyncService.disconnect(psy.id, user.sub);
    return { success: true };
  }

  @Post('google/webhook')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async handleWebhook(
    @Headers('x-goog-channel-id') channelId: string,
    @Headers('x-goog-resource-id') resourceId: string,
    @Headers('x-goog-channel-token') channelToken: string,
    @Headers('x-goog-resource-state') resourceState: string,
  ): Promise<void> {
    if (resourceState === 'sync') {
      // Initial sync notification — ignore
      return;
    }

    if (!channelId || !resourceId || !channelToken) {
      this.logger.warn('Webhook received with missing headers');
      return;
    }

    await this.calendarSyncService.handleWebhook(channelId, resourceId, channelToken);
  }

  @Post('force-sync')
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async forceSync(@CurrentUser() user: KeycloakUser) {
    const psy = await this.prisma.psychologist.findUniqueOrThrow({
      where: { userId: user.sub },
    });
    await this.calendarSyncService.performIncrementalSync(psy.id);
    return { success: true };
  }

  @Get('external-events')
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async getExternalEvents(
    @CurrentUser() user: KeycloakUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to || isNaN(new Date(from).getTime()) || isNaN(new Date(to).getTime())) {
      throw new BadRequestException('Paramètres from et to requis (format ISO date)');
    }
    const psy = await this.prisma.psychologist.findUniqueOrThrow({
      where: { userId: user.sub },
    });
    return this.prisma.externalCalendarEvent.findMany({
      where: {
        psychologistId: psy.id,
        status: { not: 'cancelled' },
        startAt: { lt: new Date(to) },
        endAt: { gt: new Date(from) },
      },
      select: { id: true, title: true, startAt: true, endAt: true, isAllDay: true },
      orderBy: { startAt: 'asc' },
    });
  }
}
