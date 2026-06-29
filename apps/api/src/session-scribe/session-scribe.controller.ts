import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequirePlan } from '../billing/decorators/require-plan.decorator';
import { SubscriptionPlan } from '@psyscale/shared-types';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { SessionScribeService } from './session-scribe.service';
import { ImportScribeAudioDto, SessionScribeStatusResponse } from './dto/session-scribe.dto';

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionScribeController {
  constructor(private readonly service: SessionScribeService) {}

  @Post(':id/scribe/audio')
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importer un audio de séance (présentiel) pour transcription Scribe IA' })
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/mpeg'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Type de fichier non supporté: ${file.mimetype}`), false);
        }
      },
    }),
  )
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async uploadAudio(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ImportScribeAudioDto,
    @CurrentUser() user: KeycloakUser,
  ): Promise<{ status: string }> {
    if (!file) throw new BadRequestException('Fichier audio manquant');
    return this.service.uploadAudio(user.sub, sessionId, file.buffer, body.consentConfirmed);
  }

  @Get(':id/scribe/status')
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Statut du Scribe IA (import audio) pour cette séance' })
  async getStatus(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: KeycloakUser,
  ): Promise<SessionScribeStatusResponse> {
    return this.service.getStatus(user.sub, sessionId);
  }
}
