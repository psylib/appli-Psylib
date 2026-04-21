import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { AccountingService } from './accounting.service';
import { FecExportService } from './fec-export.service';
import { TaxPrepService } from './tax-prep.service';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequirePlan } from '../billing/decorators/require-plan.decorator';
import { SubscriptionPlan } from '@psyscale/shared-types';

@Controller('accounting')
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly fecExportService: FecExportService,
    private readonly taxPrepService: TaxPrepService,
  ) {}

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

  // ---------------------------------------------------------------------------
  // Export routes
  // ---------------------------------------------------------------------------

  /**
   * GET /accounting/export/csv
   * Download all accounting entries as a CSV file for the given period.
   * Available on all plans.
   */
  @Get('export/csv')
  async exportCsv(
    @CurrentUser() user: KeycloakUser,
    @Res() res: Response,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    // Fetch all entries (large limit) for the period
    const result = await this.accountingService.getBook(user.sub, {
      page: 1,
      limit: 10000,
      dateFrom,
      dateTo,
    });

    const csvHeader = 'Date,Type,Libelle,Debit,Credit,Categorie,Mode de paiement\n';

    const csvRows = result.data
      .map((entry) => {
        const date = new Date(entry.date).toISOString().slice(0, 10);
        const type = entry.entryType === 'income' ? 'Recette' : 'Depense';
        const label = csvEscape(entry.label);
        const debit = entry.debit.toFixed(2);
        const credit = entry.credit.toFixed(2);
        const category = csvEscape(entry.category ?? '');
        const paymentMethod = csvEscape(entry.paymentMethod ?? '');
        return `${date},${type},${label},${debit},${credit},${category},${paymentMethod}`;
      })
      .join('\n');

    const csv = csvHeader + csvRows;

    const filename = buildCsvFilename(dateFrom, dateTo);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
  }

  /**
   * GET /accounting/export/fec?year=2025
   * Download the FEC (Fichier des Écritures Comptables) for the given fiscal year.
   * Requires Starter plan or higher (not available on Free).
   */
  @Get('export/fec')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.STARTER, SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async exportFec(
    @CurrentUser() user: KeycloakUser,
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const fiscalYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const psychologistId = await this.accountingService.resolvePsychologistId(user.sub);

    const fecContent = await this.fecExportService.generateFec(psychologistId, fiscalYear);

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `FEC_${today}.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fecContent);
  }

  /**
   * GET /accounting/tax-prep?year=2025
   * Returns 2035 Cerfa declaration preparation data.
   * Requires Pro or Clinic plan.
   */
  @Get('tax-prep')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async getTaxPrep(
    @CurrentUser() user: KeycloakUser,
    @Query('year') year: string,
  ) {
    const fiscalYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const psychologistId = await this.accountingService.resolvePsychologistId(user.sub);
    return this.taxPrepService.get2035Prep(psychologistId, fiscalYear);
  }

  /**
   * GET /accounting/social-charges?year=2025
   * Returns URSSAF + CIPAV social charges estimation.
   * Requires Pro or Clinic plan.
   */
  @Get('social-charges')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  async getSocialCharges(
    @CurrentUser() user: KeycloakUser,
    @Query('year') year: string,
  ) {
    const fiscalYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const psychologistId = await this.accountingService.resolvePsychologistId(user.sub);
    return this.taxPrepService.estimateSocialCharges(psychologistId, fiscalYear);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Escape a CSV field value — wrap in double-quotes if it contains comma, quote, or newline.
 */
function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Build a descriptive CSV filename based on the date range.
 */
function buildCsvFilename(dateFrom?: string, dateTo?: string): string {
  if (dateFrom && dateTo) {
    const from = dateFrom.slice(0, 10).replace(/-/g, '');
    const to = dateTo.slice(0, 10).replace(/-/g, '');
    return `ecritures_${from}_${to}.csv`;
  }
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `ecritures_${today}.csv`;
}
