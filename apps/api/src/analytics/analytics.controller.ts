import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Vue d\'ensemble du cabinet (KPIs)' })
  async getOverview(@CurrentUser() user: KeycloakUser): Promise<unknown> {
    return this.analyticsService.getOverview(user.sub);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenus par mois sur N derniers mois' })
  @ApiQuery({ name: 'months', required: false, type: Number, example: 6 })
  async getRevenue(
    @CurrentUser() user: KeycloakUser,
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ): Promise<unknown> {
    return this.analyticsService.getRevenueByMonth(user.sub, months);
  }

  @Get('patients')
  @ApiOperation({ summary: 'Évolution nouveaux patients par mois' })
  @ApiQuery({ name: 'months', required: false, type: Number, example: 6 })
  async getPatients(
    @CurrentUser() user: KeycloakUser,
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ): Promise<unknown> {
    return this.analyticsService.getPatientsByMonth(user.sub, months);
  }

  @Get('mood-trends')
  @ApiOperation({ summary: 'Tendances humeur des patients (30 derniers jours)' })
  async getMoodTrends(@CurrentUser() user: KeycloakUser): Promise<unknown> {
    return this.analyticsService.getMoodTrends(user.sub);
  }
}
