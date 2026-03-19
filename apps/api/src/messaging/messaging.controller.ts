import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/messaging.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Messaging')
@ApiBearerAuth()
@UseGuards(KeycloakGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * GET /messaging/conversations
   * Liste toutes les conversations de l'utilisateur connecté.
   * Supporte psychologues et patients.
   */
  @Get('conversations')
  @ApiOperation({ summary: 'Liste des conversations' })
  @ApiResponse({ status: 200, description: 'Liste des conversations avec dernier message' })
  async getConversations(@CurrentUser() user: KeycloakUser) {
    const role = user.roles.includes('patient') ? 'patient' : 'psychologist';
    return this.messagingService.getConversations(user.sub, role);
  }

  /**
   * POST /messaging/conversations
   * Crée ou récupère une conversation entre le psy connecté et un patient.
   */
  @Post('conversations')
  @ApiOperation({ summary: 'Créer ou récupérer une conversation avec un patient' })
  @ApiResponse({ status: 201, description: 'Conversation créée ou existante retournée' })
  async createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.messagingService.getOrCreateConversation(user.sub, dto.patientId);
  }

  /**
   * GET /messaging/conversations/:id/messages
   * Historique complet des messages déchiffrés d'une conversation.
   */
  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Historique des messages (déchiffrés)' })
  @ApiResponse({ status: 200, description: 'Liste des messages déchiffrés' })
  @ApiResponse({ status: 403, description: 'Non membre de cette conversation' })
  async getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.messagingService.getMessages(id, user.sub);
  }

  /**
   * PATCH /messaging/conversations/:id/read
   * Marque tous les messages reçus dans la conversation comme lus.
   */
  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Marquer les messages comme lus' })
  @ApiResponse({ status: 200, description: 'Messages marqués comme lus' })
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    await this.messagingService.markRead(id, user.sub);
    return { success: true, conversationId: id };
  }

  /**
   * GET /messaging/unread-count
   * Nombre total de messages non lus pour l'utilisateur connecté.
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre de messages non lus' })
  @ApiResponse({ status: 200, description: 'Compteur messages non lus' })
  async getUnreadCount(@CurrentUser() user: KeycloakUser) {
    const count = await this.messagingService.getUnreadCount(user.sub);
    return { unreadCount: count };
  }
}
