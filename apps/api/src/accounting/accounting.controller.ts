import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { AccountingService } from './accounting.service';

@Controller('accounting')
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('book')
  getBook(
    @CurrentUser() user: KeycloakUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('category') category?: string,
  ) {
    return this.accountingService.getBook(user.sub, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      type: type as 'income' | 'expense' | undefined,
      dateFrom,
      dateTo,
      category,
    });
  }

  @Get('summary')
  getSummary(
    @CurrentUser() user: KeycloakUser,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.accountingService.getSummary(user.sub, dateFrom, dateTo);
  }

  @Get('dashboard')
  getDashboard(@CurrentUser() user: KeycloakUser) {
    return this.accountingService.getDashboard(user.sub);
  }
}
