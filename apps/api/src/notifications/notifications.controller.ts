import {
  Controller, Get, Put, Patch, Post, Delete, Param, Body,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(KeycloakGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste des notifications (non lues d\'abord)' })
  getNotifications(@CurrentUser() user: KeycloakUser) {
    return this.notificationsService.getNotifications(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.notificationsService.markRead(id, user.sub);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  markAllRead(@CurrentUser() user: KeycloakUser) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une notification' })
  deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.notificationsService.deleteNotification(id, user.sub);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Récupérer les préférences de notification' })
  getPreferences(@CurrentUser() user: KeycloakUser) {
    return this.notificationsService.getPreferences(user.sub);
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sauvegarder les préférences de notification' })
  savePreferences(
    @Body() body: Record<string, { email: boolean; push: boolean }>,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.notificationsService.savePreferences(user.sub, body);
  }

  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enregistrer un token push (mobile)' })
  async registerPushToken(
    @Body() body: RegisterPushTokenDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    await this.pushService.registerToken(user.sub, body.token, body.platform);
    return { success: true };
  }
}
