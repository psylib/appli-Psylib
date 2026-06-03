import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  ParseUUIDPipe,
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
import { CreateVideoRoomDto, CreateInstantVideoDto, GuestJoinRequestDto } from './dto/video.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Video')
@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  // --- Protected endpoints (psy only, plan-gated) ---

  @Post('instant')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.SOLO, SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Créer une visio instantanée (sans RDV préalable)' })
  @ApiResponse({ status: 201, description: 'Visio instantanée créée' })
  async createInstantRoom(
    @Body() dto: CreateInstantVideoDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.videoService.createInstantRoom(user.sub, dto.patientId);
  }

  @Post('rooms')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.SOLO, SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
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
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.videoService.getRoomInfo(user.sub, appointmentId);
  }

  @Post('rooms/:appointmentId/token')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.SOLO, SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async getPsyToken(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
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
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    await this.videoService.endRoom(user.sub, appointmentId);
  }

  // --- Guest invite / waiting room (psy only) ---

  @Post('rooms/:appointmentId/invite')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.SOLO, SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiOperation({ summary: 'Générer un lien d\'invitation invité pour la visio en cours' })
  async createGuestInvite(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.videoService.createGuestInvite(user.sub, appointmentId);
  }

  @Post('rooms/:appointmentId/invite/revoke')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Révoquer le lien d\'invitation invité' })
  async revokeGuestInvite(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.videoService.revokeGuestInvite(user.sub, appointmentId);
  }

  @Get('rooms/:appointmentId/guests')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Liste des invités en attente / admis' })
  async listGuests(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.videoService.listGuests(user.sub, appointmentId);
  }

  @Post('guests/:guestId/admit')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Admettre un invité dans la visio' })
  async admitGuest(@Param('guestId') guestId: string, @CurrentUser() user: KeycloakUser) {
    return this.videoService.admitGuest(user.sub, guestId);
  }

  @Post('guests/:guestId/deny')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Refuser un invité' })
  async denyGuest(@Param('guestId') guestId: string, @CurrentUser() user: KeycloakUser) {
    return this.videoService.denyGuest(user.sub, guestId);
  }

  // --- Public endpoints (patient, rate limited) ---

  @Post('join/:token')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async joinAsPatient(@Param('token', ParseUUIDPipe) token: string) {
    return this.videoService.generatePatientToken(token);
  }

  @Post('consent/:token')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async recordConsent(@Param('token', ParseUUIDPipe) token: string, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    await this.videoService.recordConsent(token, ip);
    return { ok: true };
  }

  // --- Guest public flow (rate limited) ---

  @Get('guest/:inviteToken')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Valider un lien d\'invitation invité' })
  async resolveGuestInvite(@Param('inviteToken', ParseUUIDPipe) inviteToken: string) {
    return this.videoService.resolveGuestInvite(inviteToken);
  }

  @Post('guest/:inviteToken/request')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Demander à rejoindre la visio en tant qu\'invité' })
  async requestGuestJoin(
    @Param('inviteToken', ParseUUIDPipe) inviteToken: string,
    @Body() dto: GuestJoinRequestDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.videoService.requestGuestJoin(inviteToken, dto.displayName, ip);
  }

  @Get('guest/session/:sessionToken/status')
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  @ApiOperation({ summary: 'Statut d\'admission de l\'invité (polling)' })
  async getGuestStatus(@Param('sessionToken', ParseUUIDPipe) sessionToken: string) {
    return this.videoService.getGuestStatus(sessionToken);
  }
}
