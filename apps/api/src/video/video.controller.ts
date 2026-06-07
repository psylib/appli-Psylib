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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequirePlan } from '../billing/decorators/require-plan.decorator';
import { SubscriptionPlan } from '@psyscale/shared-types';
import { VideoService } from './video.service';
import { CreateVideoRoomDto, CreateInstantVideoDto, GuestJoinRequestDto, RecordConsentDto, ScribeStatusResponse, EnableScribeDto } from './dto/video.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
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

  // --- Scribe IA (Pro + Clinic) ---

  @Post('rooms/:appointmentId/scribe/enable')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiOperation({ summary: 'Activer/désactiver le Scribe IA pour cette séance' })
  async enableScribe(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() body: EnableScribeDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.videoService.enableScribe(user.sub, appointmentId, body.enabled);
  }

  @Post('rooms/:appointmentId/scribe/audio')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav', 'audio/mpeg'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Type de fichier non supporté: ${file.mimetype}`), false);
        }
      },
    }),
  )
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Upload audio WebM pour transcription Scribe IA' })
  async uploadScribeAudio(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: KeycloakUser,
  ) {
    if (!file) throw new BadRequestException('Fichier audio manquant');
    return this.videoService.uploadScribeAudio(user.sub, appointmentId, file.buffer);
  }

  @Get('rooms/:appointmentId/scribe/status')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Statut du Scribe IA pour cette séance' })
  async getScribeStatus(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser() user: KeycloakUser,
  ): Promise<ScribeStatusResponse> {
    return this.videoService.getScribeStatus(user.sub, appointmentId);
  }

  // --- Public endpoints (patient, rate limited) ---

  @Post('join/:token')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async joinAsPatient(@Param('token', ParseUUIDPipe) token: string) {
    return this.videoService.generatePatientToken(token);
  }

  @Post('consent/:token')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async recordConsent(
    @Param('token', ParseUUIDPipe) token: string,
    @Req() req: Request,
    @Body() body: RecordConsentDto,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    await this.videoService.recordConsent(token, ip, body?.includeScribe ?? false);
    return { ok: true };
  }

  // --- Guest public flow (rate limited) ---

  @Get('guest/:inviteToken')
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Valider un lien d\'invitation invité' })
  async resolveGuestInvite(@Param('inviteToken', ParseUUIDPipe) inviteToken: string) {
    return this.videoService.resolveGuestInvite(inviteToken);
  }

  @Post('guest/:inviteToken/request')
  @Public()
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
  @Public()
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  @ApiOperation({ summary: 'Statut d\'admission de l\'invité (polling)' })
  async getGuestStatus(@Param('sessionToken', ParseUUIDPipe) sessionToken: string) {
    return this.videoService.getGuestStatus(sessionToken);
  }
}
