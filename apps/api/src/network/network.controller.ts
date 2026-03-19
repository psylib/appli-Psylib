import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NetworkService } from './network.service';
import { UpsertNetworkProfileDto, CreateReferralDto, UpdateReferralStatusDto, CreateGroupDto, DirectoryQueryDto } from './dto/network.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Network')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('network')
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  // ─── PROFIL ───────────────────────────────────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: 'Mon profil réseau' })
  getMyProfile(@CurrentUser() user: KeycloakUser) {
    return this.networkService.getMyProfile(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Créer/mettre à jour mon profil réseau' })
  upsertProfile(@Body() dto: UpsertNetworkProfileDto, @CurrentUser() user: KeycloakUser) {
    return this.networkService.upsertProfile(user.sub, dto);
  }

  // ─── ANNUAIRE ──────────────────────────────────────────────────────────────

  @Get('directory')
  @ApiOperation({ summary: 'Annuaire des psychologues' })
  getDirectory(@Query() query: DirectoryQueryDto, @CurrentUser() user: KeycloakUser) {
    return this.networkService.getDirectory(user.sub, query);
  }

  @Get('directory/:slug')
  @ApiOperation({ summary: 'Profil public d\'un psy par slug' })
  getPsyProfile(@Param('slug') slug: string, @CurrentUser() user: KeycloakUser) {
    return this.networkService.getPsyPublicProfile(slug, user.sub);
  }

  // ─── ADRESSAGES ────────────────────────────────────────────────────────────

  @Get('referrals')
  @ApiOperation({ summary: 'Mes adressages (envoyés + reçus)' })
  getMyReferrals(@CurrentUser() user: KeycloakUser) {
    return this.networkService.getMyReferrals(user.sub);
  }

  @Post('referrals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un adressage' })
  createReferral(@Body() dto: CreateReferralDto, @CurrentUser() user: KeycloakUser) {
    return this.networkService.createReferral(user.sub, dto);
  }

  @Put('referrals/:id/status')
  @ApiOperation({ summary: 'Accepter / décliner / compléter un adressage' })
  updateReferralStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReferralStatusDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.networkService.updateReferralStatus(id, user.sub, dto);
  }

  // ─── GROUPES ───────────────────────────────────────────────────────────────

  @Get('groups')
  @ApiOperation({ summary: 'Mes groupes + groupes publics disponibles' })
  getGroups(@CurrentUser() user: KeycloakUser) {
    return this.networkService.getGroups(user.sub);
  }

  @Post('groups')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un groupe de supervision/intervision' })
  createGroup(@Body() dto: CreateGroupDto, @CurrentUser() user: KeycloakUser) {
    return this.networkService.createGroup(user.sub, dto);
  }

  @Post('groups/:id/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejoindre un groupe public' })
  joinGroup(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: KeycloakUser) {
    return this.networkService.joinGroup(id, user.sub);
  }

  @Post('groups/:id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitter un groupe' })
  leaveGroup(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: KeycloakUser) {
    return this.networkService.leaveGroup(id, user.sub);
  }
}
