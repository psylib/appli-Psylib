import { Controller, Get, UseGuards } from '@nestjs/common';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * AccountingController — Skeleton routes for accounting book, summary and dashboard.
 * Full implementation: Task 4 full.
 */
@Controller('accounting')
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
export class AccountingController {
  /**
   * GET /accounting/book
   * TODO: Task 4 full — return paginated accounting entries (livre des recettes / dépenses)
   */
  @Get('book')
  getBook() {
    return [];
  }

  /**
   * GET /accounting/summary
   * TODO: Task 4 full — return income/expense summary by period and category
   */
  @Get('summary')
  getSummary() {
    return {};
  }

  /**
   * GET /accounting/dashboard
   * TODO: Task 4 full — return accounting dashboard KPIs
   */
  @Get('dashboard')
  getDashboard() {
    return {};
  }
}
