import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'KPIs dashboard principal' })
  async getKpis(@CurrentUser() user: KeycloakUser) {
    return this.dashboardService.getKpis(user.sub);
  }

  @Get('checklist')
  @ApiOperation({ summary: "Checklist d'activation du compte" })
  async getActivationChecklist(@CurrentUser() user: KeycloakUser) {
    return this.dashboardService.getActivationChecklist(user.sub);
  }
}
