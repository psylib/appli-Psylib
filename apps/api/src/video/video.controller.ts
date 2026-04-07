import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequirePlan } from '../billing/decorators/require-plan.decorator';
import { SubscriptionPlan } from '@psyscale/shared-types';
import { VideoService } from './video.service';
import { CreateVideoRoomDto } from './dto/video.dto';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Video')
@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  // --- Protected endpoints (psy only, plan-gated) ---

  @Post('rooms')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async createRoom(
    @Body() dto: CreateVideoRoomDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.videoService.createRoom(user.sub, dto.appointmentId);
  }

  @Get('rooms/:appointmentId')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async getRoom(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.videoService.getRoomInfo(user.sub, appointmentId);
  }

  @Post('rooms/:appointmentId/token')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async getPsyToken(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.videoService.generatePsyToken(user.sub, appointmentId);
  }

  @Get('today')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  async getTodayRooms(@CurrentUser() user: KeycloakUser) {
    return this.videoService.getTodayRooms(user.sub);
  }

  @Post('rooms/:appointmentId/end')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @HttpCode(204)
  async endRoom(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    await this.videoService.endRoom(user.sub, appointmentId);
  }

  // --- Public endpoints (patient, rate limited) ---

  @Post('join/:token')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async joinAsPatient(@Param('token') token: string) {
    return this.videoService.generatePatientToken(token);
  }

  @Post('consent/:token')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async recordConsent(@Param('token') token: string, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    await this.videoService.recordConsent(token, ip);
    return { ok: true };
  }
}
