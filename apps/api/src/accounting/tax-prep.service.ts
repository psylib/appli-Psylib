import { Injectable, Logger } from '@nestjs/common';
import { AccountingEntryType } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CATEGORY_TO_2035_LINE } from './bnc-account-codes';

/**
 * Tax Prep Service
 *
 * Provides:
 *  - 2035 Cerfa declaration preparation (BNC psychologists)
 *  - Social charges estimation (URSSAF + CIPAV) based on net profit
 *
 * All figures are ESTIMATES only. Official rates may change yearly.
 * Disclaimer is included in all returned objects.
 */
@Injectable()
export class TaxPrepService {
  private readonly logger = new Logger(TaxPrepService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get 2035 tax declaration preparation data.
   * Returns income total, expenses mapped to 2035 lines, and net result.
   */
  async get2035Prep(psychologistId: string, year: number) {
    this.logger.log(`Computing 2035 prep for psychologistId=${psychologistId} year=${year}`);

    // Income total (line AA — recettes encaissées)
    const income = await this.prisma.accountingEntry.aggregate({
      where: {
        psychologistId,
        fiscalYear: year,
        entryType: AccountingEntryType.income,
        deletedAt: null,
      },
      _sum: { credit: true },
      _count: true,
    });

    // Expenses grouped by category
    const expensesByCategory = await this.prisma.accountingEntry.groupBy({
      by: ['category'],
      where: {
        psychologistId,
        fiscalYear: year,
        entryType: AccountingEntryType.expense,
        deletedAt: null,
      },
      _sum: { debit: true },
    });

    // Map categories to 2035 lines
    const lines2035: Record<string, { label: string; amount: number }> = {};

    for (const group of expensesByCategory) {
      const line = CATEGORY_TO_2035_LINE[group.category] ?? 'CP';
      if (!lines2035[line]) {
        lines2035[line] = { label: get2035LineLabel(line), amount: 0 };
      }
      lines2035[line].amount += Number(group._sum.debit ?? 0);
    }

    // Round all line amounts to 2 decimal places
    for (const line of Object.values(lines2035)) {
      line.amount = round2(line.amount);
    }

    const totalIncome = Number(income._sum.credit ?? 0);
    const totalExpenses = round2(
      Object.values(lines2035).reduce((sum, l) => sum + l.amount, 0),
    );

    return {
      year,
      income: {
        total: round2(totalIncome),
        count: income._count,
        line: 'AA',
        label: 'Recettes encaissées',
      },
      expenses: {
        total: totalExpenses,
        lines: lines2035,
      },
      netResult: round2(totalIncome - totalExpenses),
      disclaimer:
        'Estimation indicative — consultez votre AGA ou expert-comptable pour la déclaration officielle.',
    };
  }

  /**
   * Estimate URSSAF + CIPAV social charges for a given fiscal year.
   * Based on approximate 2026 rates for profession libérale (BNC).
   */
  async estimateSocialCharges(psychologistId: string, year: number) {
    this.logger.log(`Estimating social charges for psychologistId=${psychologistId} year=${year}`);

    const prep = await this.get2035Prep(psychologistId, year);
    const netProfit = Math.max(0, prep.netResult);

    // URSSAF rates (approximate 2026 profession libérale BNC)
    const urssaf = {
      maladie: round2(netProfit * 0.066),               // 6.6% — maladie-maternité
      allocationsFamiliales: round2(netProfit * 0.031), // 3.1% — allocations familiales
      csgCrds: round2(netProfit * 0.097),               // 9.7% — CSG + CRDS
      cfp: round2(netProfit * 0.0025),                  // 0.25% — contribution à la formation professionnelle
    };
    const urssafTotal = round2(
      urssaf.maladie +
      urssaf.allocationsFamiliales +
      urssaf.csgCrds +
      urssaf.cfp,
    );

    // CIPAV rates (simplified brackets for psychologues libéraux)
    const cipav = {
      retraiteBase: round2(
        Math.min(netProfit, 46368) * 0.1012 +
        Math.max(0, netProfit - 46368) * 0.0187,
      ),
      retraiteComplementaire: getCipavComplementaire(netProfit),
      invaliditeDeces: 76, // Forfait classe A (montant fixe)
    };
    const cipavTotal = round2(
      cipav.retraiteBase +
      cipav.retraiteComplementaire +
      cipav.invaliditeDeces,
    );

    const total = round2(urssafTotal + cipavTotal);

    return {
      year,
      netProfit,
      urssaf: {
        maladie: urssaf.maladie,
        allocationsFamiliales: urssaf.allocationsFamiliales,
        csgCrds: urssaf.csgCrds,
        cfp: urssaf.cfp,
        total: urssafTotal,
      },
      cipav: {
        retraiteBase: cipav.retraiteBase,
        retraiteComplementaire: cipav.retraiteComplementaire,
        invaliditeDeces: cipav.invaliditeDeces,
        total: cipavTotal,
      },
      total,
      monthlyProvision: round2(total / 12),
      effectiveRate: netProfit > 0 ? round2((total / netProfit) * 100) : 0,
      disclaimer:
        "Estimation indicative basée sur les taux 2026 approximatifs. Les montants réels peuvent varier. Consultez votre AGA ou expert-comptable.",
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * CIPAV retraite complémentaire — simplified bracket table.
 * Source: approximate 2026 CIPAV class A tranches.
 */
function getCipavComplementaire(netProfit: number): number {
  if (netProfit <= 29076) return 1527;
  if (netProfit <= 58152) return 3055;
  if (netProfit <= 87228) return 4583;
  return 7638;
}

/**
 * Human-readable labels for Cerfa 2035 declaration lines.
 */
function get2035LineLabel(line: string): string {
  const labels: Record<string, string> = {
    AA: 'Recettes encaissées',
    BA: 'Achats',
    BM: 'Petit outillage',
    BP: 'Entretien et réparations',
    BQ: 'Transports et déplacements',
    BS: 'Assurances',
    BT: 'Honoraires ne constituant pas des rétrocessions',
    BV: 'Cotisations syndicales et professionnelles',
    CB: 'Charges financières',
    CO: 'Autres impôts',
    CP: 'Charges diverses de gestion',
  };
  return labels[line] ?? 'Divers';
}
