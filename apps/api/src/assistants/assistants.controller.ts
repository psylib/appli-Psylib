import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { AssistantsService } from './assistants.service';
import {
  InviteAssistantDto,
  AcceptAssistantInvitationDto,
} from './dto/assistant.dto';

@ApiTags('Assistants')
@Controller('assistants')
export class AssistantsController {
  constructor(private readonly service: AssistantsService) {}

  // ── Authenticated endpoints (psychologist / admin) ────────────────

  @Post()
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Inviter un·e assistant·e collaborateur·rice' })
  inviteAssistant(
    @CurrentUser() user: KeycloakUser,
    @Body() dto: InviteAssistantDto,
  ) {
    return this.service.inviteAssistant(user.sub, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Lister les assistant·e·s du cabinet' })
  listAssistants(@CurrentUser() user: KeycloakUser) {
    return this.service.listAssistants(user.sub);
  }

  // ── Public endpoints (token-based, no guards) ─────────────────────
  // Declared before `:id` to avoid route collision.

  @Get('invitations/:token')
  @Public()
  @ApiOperation({ summary: 'Valider un token d\'invitation assistant (public)' })
  validateToken(@Param('token') token: string) {
    return this.service.validateToken(token);
  }

  @Post('invitations/:token/accept')
  @Public()
  @ApiOperation({ summary: 'Accepter l\'invitation assistant — créer le compte (public)' })
  acceptInvitation(
    @Param('token') token: string,
    @Body() dto: AcceptAssistantInvitationDto,
  ) {
    return this.service.acceptInvitation(token, dto.password);
  }

  // ── Authenticated: revoke (after static routes to avoid collision) ─

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Révoquer l\'accès d\'un·e assistant·e' })
  revokeAssistant(
    @CurrentUser() user: KeycloakUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.revokeAssistant(user.sub, id);
  }
}
