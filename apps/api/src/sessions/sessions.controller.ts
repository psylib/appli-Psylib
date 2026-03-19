import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { IsString, MaxLength } from 'class-validator';
import { SessionsService } from './sessions.service';
import {
  CreateSessionDto,
  UpdateSessionDto,
  SessionQueryDto,
} from './dto/session.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditInterceptor } from '../common/audit.interceptor';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequireFeature } from '../billing/decorators/require-plan.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

class AutosaveDto {
  @IsString()
  @MaxLength(100000)
  notes!: string;
}

@ApiTags('Sessions')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@UseInterceptors(AuditInterceptor)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @UseGuards(SubscriptionGuard)
  @RequireFeature('sessions')
  @ApiOperation({ summary: 'Créer une séance' })
  async create(
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.sessionsService.create(user.sub, dto, user.sub, req);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des séances avec filtres' })
  async findAll(
    @Query() query: SessionQueryDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.sessionsService.findAll(user.sub, query, user.sub, req);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Stats mensuelles séances + revenus' })
  async getStats(@CurrentUser() user: KeycloakUser) {
    return this.sessionsService.getMonthlyStats(user.sub);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export CSV de toutes les séances' })
  async exportCsv(
    @CurrentUser() user: KeycloakUser,
    @Res() res: Response,
  ) {
    const csv = await this.sessionsService.exportAllCsv(user.sub);
    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="seances-${date}.csv"`);
    res.send('\uFEFF' + csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail séance (notes déchiffrées)' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.sessionsService.findOne(user.sub, id, user.sub, req);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une séance' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.sessionsService.update(user.sub, id, dto, user.sub, req);
  }

  @Patch(':id/autosave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autosave notes (30s interval)' })
  @ApiBody({ type: AutosaveDto })
  async autosave(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AutosaveDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.sessionsService.autosaveNotes(user.sub, id, body.notes, user.sub);
  }
}
