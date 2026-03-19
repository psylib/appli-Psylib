import {
  Controller, Get, Post, Put, Delete, Body, Param,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupervisionService } from './supervision.service';
import {
  CreateGroupDto, UpdateGroupDto, CreateSessionDto,
  UpdateSessionDto, CreateCaseStudyDto,
} from './dto/supervision.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Supervision')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('supervision')
export class SupervisionController {
  constructor(private readonly supervisionService: SupervisionService) {}

  // ─── Groupes ─────────────────────────────────────────────────────────────

  @Get('groups')
  @ApiOperation({ summary: 'Mes groupes (propriétaire ou membre)' })
  getMyGroups(@CurrentUser() user: KeycloakUser) {
    return this.supervisionService.getMyGroups(user.sub);
  }

  @Post('groups')
  @ApiOperation({ summary: 'Créer un groupe de supervision/intervision' })
  createGroup(@Body() dto: CreateGroupDto, @CurrentUser() user: KeycloakUser) {
    return this.supervisionService.createGroup(user.sub, dto);
  }

  @Put('groups/:id')
  @ApiOperation({ summary: 'Modifier un groupe (propriétaire seulement)' })
  updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.supervisionService.updateGroup(user.sub, id, dto);
  }

  @Delete('groups/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un groupe (propriétaire seulement)' })
  deleteGroup(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: KeycloakUser) {
    return this.supervisionService.deleteGroup(user.sub, id);
  }

  @Post('groups/:id/join')
  @ApiOperation({ summary: 'Rejoindre un groupe' })
  joinGroup(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: KeycloakUser) {
    return this.supervisionService.joinGroup(user.sub, id);
  }

  @Delete('groups/:id/leave')
  @ApiOperation({ summary: 'Quitter un groupe' })
  leaveGroup(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: KeycloakUser) {
    return this.supervisionService.leaveGroup(user.sub, id);
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  @Get('groups/:id/sessions')
  @ApiOperation({ summary: 'Sessions d\'un groupe' })
  getSessions(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: KeycloakUser) {
    return this.supervisionService.getSessions(user.sub, id);
  }

  @Post('groups/:id/sessions')
  @ApiOperation({ summary: 'Créer une session' })
  createSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.supervisionService.createSession(user.sub, id, dto);
  }

  @Put('sessions/:id')
  @ApiOperation({ summary: 'Modifier une session (notes, statut, etc.)' })
  updateSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.supervisionService.updateSession(user.sub, id, dto);
  }

  // ─── Cas cliniques ────────────────────────────────────────────────────────

  @Get('sessions/:id/cases')
  @ApiOperation({ summary: 'Cas cliniques d\'une session' })
  getCaseStudies(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: KeycloakUser) {
    return this.supervisionService.getCaseStudies(user.sub, id);
  }

  @Post('sessions/cases')
  @ApiOperation({ summary: 'Soumettre un cas clinique anonymisé' })
  createCaseStudy(@Body() dto: CreateCaseStudyDto, @CurrentUser() user: KeycloakUser) {
    return this.supervisionService.createCaseStudy(user.sub, dto);
  }
}
