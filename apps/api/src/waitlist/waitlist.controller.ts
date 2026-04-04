import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../common/prisma.service';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

// ── Protected routes (psy only) ─────────────────────────────────────────────

@ApiTags('Waitlist')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('waitlist')
export class WaitlistController {
  constructor(
    private readonly waitlistService: WaitlistService,
    private readonly prisma: PrismaService,
  ) {}

  private async getPsyId(userId: string): Promise<string> {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy.id;
  }

  @Get()
  @ApiOperation({ summary: 'Liste d\'attente du psy' })
  async findAll(@CurrentUser() user: KeycloakUser) {
    const psyId = await this.getPsyId(user.sub);
    return this.waitlistService.findAll(psyId);
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter un patient à la liste d\'attente' })
  async create(
    @Body() dto: CreateWaitlistEntryDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.waitlistService.create(psyId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une entrée' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.waitlistService.updateStatus(psyId, id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une entrée de la liste d\'attente' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.waitlistService.remove(psyId, id);
  }

  @Post(':id/propose-slot')
  @ApiOperation({ summary: 'Proposer un créneau à un patient en attente' })
  async proposeSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('slotDate') slotDate: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.waitlistService.proposeSlot(psyId, id, new Date(slotDate));
  }
}

// ── Public route (no auth) ──────────────────────────────────────────────────

@ApiTags('Public Waitlist')
@Controller('public/psy')
export class PublicWaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post(':slug/waitlist')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { ttl: 60000, limit: 3 }, long: { ttl: 3600000, limit: 10 } })
  @ApiOperation({ summary: 'S\'inscrire sur la liste d\'attente (public)' })
  async createPublic(
    @Param('slug') slug: string,
    @Body() dto: CreateWaitlistEntryDto,
  ) {
    return this.waitlistService.createPublic(slug, dto);
  }
}
