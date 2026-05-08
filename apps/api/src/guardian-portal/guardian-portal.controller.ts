import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { GuardianJwtGuard } from './guards/guardian-jwt.guard';
import { GuardianAccessGuard } from './guards/guardian-access.guard';
import { CurrentGuardian } from './decorators/current-guardian.decorator';
import { RequirePermission } from './decorators/require-permission.decorator';
import { GuardianPortalService } from './guardian-portal.service';
import type { GuardianUser } from './strategies/guardian-jwt.strategy';

@ApiTags('Guardian Portal')
@ApiBearerAuth()
@Controller('guardian-portal')
export class GuardianPortalController {
  constructor(private readonly service: GuardianPortalService) {}

  // ─── LIST MINORS ─────────────────────────────────────────────────────────

  @Get('minors')
  @UseGuards(GuardianJwtGuard)
  @ApiOperation({ summary: 'Liste des mineurs lies au tuteur' })
  getMinors(@CurrentGuardian() user: GuardianUser) {
    return this.service.getMinors(user.sub);
  }

  // ─── DASHBOARD ───────────────────────────────────────────────────────────

  @Get('minors/:patientId/dashboard')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('portal')
  @ApiOperation({ summary: 'Dashboard du mineur' })
  getDashboard(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Req() req: Request,
  ) {
    return this.service.getDashboard(user.sub, patientId, req);
  }

  // ─── MOOD ────────────────────────────────────────────────────────────────

  @Get('minors/:patientId/mood')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('portal')
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiOperation({ summary: 'Historique humeur du mineur' })
  getMood(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Req() req: Request,
  ) {
    return this.service.getMood(user.sub, patientId, days, req);
  }

  // ─── EXERCISES ───────────────────────────────────────────────────────────

  @Get('minors/:patientId/exercises')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('portal')
  @ApiOperation({ summary: 'Exercices assignes au mineur' })
  getExercises(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Req() req: Request,
  ) {
    return this.service.getExercises(user.sub, patientId, req);
  }

  // ─── JOURNAL ─────────────────────────────────────────────────────────────

  @Get('minors/:patientId/journal')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('portal')
  @ApiOperation({ summary: 'Entrees de journal non privees du mineur' })
  getJournal(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Req() req: Request,
  ) {
    return this.service.getJournal(user.sub, patientId, req);
  }

  // ─── DOCUMENTS ───────────────────────────────────────────────────────────

  @Get('minors/:patientId/documents')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('documents')
  @ApiOperation({ summary: 'Documents partages du mineur' })
  getDocuments(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Req() req: Request,
  ) {
    return this.service.getDocuments(user.sub, patientId, req);
  }

  // ─── INVOICES ────────────────────────────────────────────────────────────

  @Get('minors/:patientId/invoices')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('invoices')
  @ApiOperation({ summary: 'Factures du mineur' })
  getInvoices(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Req() req: Request,
  ) {
    return this.service.getInvoices(user.sub, patientId, req);
  }
}
