/**
 * Backfill script: populate accounting_entries from existing paid invoices and payments.
 *
 * Usage:
 *   npx tsx apps/api/src/accounting/backfill-accounting-entries.ts
 *   DRY_RUN=true npx tsx apps/api/src/accounting/backfill-accounting-entries.ts
 *
 * This script is idempotent — safe to re-run. It checks for existing entries before creating.
 * Set DRY_RUN=true to preview what would be created without writing anything to the DB.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 50;

async function main() {
  console.log('='.repeat(60));
  console.log(`Accounting Entries Backfill`);
  console.log(`DRY_RUN=${DRY_RUN}`);
  console.log('='.repeat(60));

  const totalPsychologists = await prisma.psychologist.count();
  console.log(`Total psychologists: ${totalPsychologists}\n`);

  if (totalPsychologists === 0) {
    console.log('No psychologists found. Nothing to do.');
    return;
  }

  let processedCount = 0;
  let createdEntries = 0;
  let skippedEntries = 0;

  for (let skip = 0; skip < totalPsychologists; skip += BATCH_SIZE) {
    const psychologists = await prisma.psychologist.findMany({
      skip,
      take: BATCH_SIZE,
      select: { id: true, userId: true },
    });

    for (const psy of psychologists) {
      // -----------------------------------------------------------------------
      // 1. Process paid invoices
      // -----------------------------------------------------------------------
      const paidInvoices = await prisma.invoice.findMany({
        where: {
          psychologistId: psy.id,
          status: 'paid',
        },
        include: {
          patient: { select: { name: true } },
        },
      });

      for (const invoice of paidInvoices) {
        // Check if an accounting entry already exists for this invoice
        const existing = await prisma.accountingEntry.findFirst({
          where: {
            psychologistId: psy.id,
            invoiceId: invoice.id,
            entryType: 'income',
            deletedAt: null,
          },
        });

        if (existing) {
          skippedEntries++;
          continue;
        }

        const year = invoice.issuedAt.getFullYear();
        const patientName = invoice.patient?.name ?? 'Patient';

        if (!DRY_RUN) {
          const ecritureNum = await getNextEcritureNum(psy.id, year);
          await prisma.accountingEntry.create({
            data: {
              psychologistId: psy.id,
              date: invoice.issuedAt,
              entryType: 'income',
              label: `Honoraires — ${patientName}`,
              debit: 0,
              credit: invoice.amountTtc,
              category: 'income',
              paymentMethod: 'manual',
              invoiceId: invoice.id,
              counterpart: patientName,
              pieceRef: invoice.invoiceNumber,
              ecritureNum,
              fiscalYear: year,
            },
          });
          createdEntries++;
        } else {
          console.log(
            `  [DRY] Would create entry for invoice ${invoice.invoiceNumber}` +
              ` — ${Number(invoice.amountTtc)}€ (${year}) [patient: ${patientName}]`,
          );
          createdEntries++;
        }
      }

      // -----------------------------------------------------------------------
      // 2. Process paid payments WITHOUT a linked invoice
      //    (invoices are handled above; avoid double-counting)
      // -----------------------------------------------------------------------
      const paidPayments = await prisma.payment.findMany({
        where: {
          psychologistId: psy.id,
          status: 'paid',
        },
        include: {
          patient: { select: { name: true } },
          invoices: { select: { id: true } },
        },
      });

      for (const payment of paidPayments) {
        // Skip if this payment already has at least one invoice (handled above)
        if (payment.invoices.length > 0) {
          skippedEntries++;
          continue;
        }

        // Check if an accounting entry already exists for this payment
        const existing = await prisma.accountingEntry.findFirst({
          where: {
            psychologistId: psy.id,
            paymentId: payment.id,
            entryType: 'income',
            deletedAt: null,
          },
        });

        if (existing) {
          skippedEntries++;
          continue;
        }

        const year = payment.createdAt.getFullYear();
        const patientName = payment.patient?.name ?? 'Patient';

        if (!DRY_RUN) {
          const ecritureNum = await getNextEcritureNum(psy.id, year);
          await prisma.accountingEntry.create({
            data: {
              psychologistId: psy.id,
              date: payment.createdAt,
              entryType: 'income',
              label: `Honoraires — ${patientName}`,
              debit: 0,
              credit: payment.amount,
              category: 'income',
              paymentMethod: payment.stripePaymentIntentId ? 'stripe' : 'manual',
              paymentId: payment.id,
              counterpart: patientName,
              pieceRef: null,
              ecritureNum,
              fiscalYear: year,
            },
          });
          createdEntries++;
        } else {
          console.log(
            `  [DRY] Would create entry for payment ${payment.id}` +
              ` — ${Number(payment.amount)}€ (${year}) [patient: ${patientName}]`,
          );
          createdEntries++;
        }
      }

      processedCount++;
    }

    // Progress report after each batch
    const verb = DRY_RUN ? 'would be created' : 'created';
    console.log(
      `Progress: ${processedCount}/${totalPsychologists} psychologists` +
        ` — ${createdEntries} entries ${verb}, ${skippedEntries} skipped`,
    );
  }

  console.log('\n' + '='.repeat(60));
  const verb = DRY_RUN ? 'would be created' : 'created';
  console.log(`Done! ${createdEntries} entries ${verb}, ${skippedEntries} skipped.`);
  console.log('='.repeat(60));
}

/**
 * Atomically increments and returns the next ecritureNum for a given
 * psychologist/fiscal-year pair. Uses INSERT ... ON CONFLICT DO UPDATE
 * to ensure there are no race conditions if the script is run concurrently.
 *
 * This is identical to the pattern used in AccountingService.getNextEcritureNum.
 */
async function getNextEcritureNum(
  psychologistId: string,
  fiscalYear: number,
): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ last_number: number }>>`
    INSERT INTO fec_sequences ("psychologist_id", "year", "last_number")
    VALUES (${psychologistId}, ${fiscalYear}, 1)
    ON CONFLICT ("psychologist_id", "year")
    DO UPDATE SET "last_number" = fec_sequences."last_number" + 1
    RETURNING "last_number"
  `;
  const row = result[0];
  if (!row) {
    throw new Error(
      `Failed to get ecritureNum for psychologistId=${psychologistId} year=${fiscalYear}`,
    );
  }
  return row.last_number;
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
