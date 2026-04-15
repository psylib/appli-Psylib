# Design Spec: Module Comptabilite PsyLib

**Date:** 2026-04-15
**Status:** Reviewed (issues addressed)
**Reviewed by:** Claude Opus 4.6 (spec-document-reviewer)
**Author:** Claude (brainstorming session)

---

## 1. Problem Statement

French psychologists in private practice (psychologues liberaux) currently need two separate tools: a practice management tool (e.g., Docorga, PsyLib) and a separate accounting tool (e.g., Indy, Freebe, or Excel). None of the French competitors in the "psy practice management" space offer integrated accounting. PsyLib already tracks all income data (invoices, payments, Stripe). Adding expense tracking, a unified ledger, and regulatory exports (FEC, 2035 prep) makes PsyLib the single tool a psychologist needs.

## 2. Goals

1. **Auto-generated income book** (livre des recettes) from existing invoices/payments data — zero additional effort for the psychologist
2. **Manual expense tracking** with pre-configured BNC categories specific to psychologists
3. **Recurring expenses** auto-generated monthly/quarterly/yearly to reduce mental load on fixed costs
4. **Unified accounting ledger** (livre-journal) combining income + expenses chronologically
5. **Financial dashboard** with P&L, category breakdown, trends, and social charge estimator
6. **Regulatory exports**: CSV, FEC (Fichier des Ecritures Comptables, 18-column norm), and 2035 declaration preparation
7. **Plan-gated features** with progressive access from Free to Clinic

## 3. Non-Goals

- Bank synchronization (Open Banking / GoCardless / Plaid) — too complex for MVP, can be Phase 2
- Full double-entry accounting — PsyLib uses cash-basis accounting (comptabilite de tresorerie), which is the norm for BNC professionals
- Replacement for an expert-comptable for complex cases (societes, SELARL)
- VAT management for mixed activities — documented as limitation, manual workaround possible
- OCR/AI receipt scanning — potential future enhancement

## 4. Context: French Psychologist Accounting Obligations

### Regime BNC (Benefices Non Commerciaux)

| Regime | Threshold | Accounting Obligations |
|--------|-----------|----------------------|
| **Micro-BNC** | Revenue < 77,700 EUR/year | Livre des recettes only (chronological) |
| **Declaration controlee** | Revenue > 77,700 EUR or voluntary opt-in | Livre-journal (income + expenses), registre des immobilisations, declaration 2035, FEC |

### Key Facts
- Psychologists are **VAT-exempt** on therapy sessions (Art. 261-4-1 CGI) — already handled in PsyLib invoices
- Ancillary activities (training, coaching) may be subject to VAT if > 34,400 EUR
- Social charges (URSSAF + CIPAV): approximately 35-45% of net profit
- Justificatives must be kept for **10 years**
- CGA (Centre de Gestion Agree) membership avoids 25% markup on taxable income
- Common deductible expenses: office rent, insurance (RCP), equipment, software, training, supervision, transport, professional subscriptions, tests/tools

### Cash-Basis Accounting
BNC professionals in France use **cash-basis accounting** (comptabilite de tresorerie): income is recorded when received, expenses when paid. This is simpler than accrual accounting and aligns perfectly with PsyLib's existing invoice/payment model.

## 5. Plan Gating

| Feature | Free | Solo (25 EUR) | Pro (40 EUR) | Clinic (79 EUR) |
|---------|------|---------------|--------------|-----------------|
| Income book (auto from invoices/payments) | Yes | Yes | Yes | Yes |
| Manual expense entry | 30/month | Unlimited | Unlimited | Unlimited |
| Pre-configured BNC categories | Yes | Yes | Yes | Yes |
| Receipt upload (justificatifs) | No | Yes | Yes | Yes |
| Recurring expenses (auto-generation) | No | No | Yes | Yes |
| Basic financial summary (monthly totals) | Yes | Yes | Yes | Yes |
| Advanced financial dashboard (P&L, charts) | No | Basic | Full | Full |
| CSV export | Yes | Yes | Yes | Yes |
| FEC export (regulatory norm) | No | Yes | Yes | Yes |
| 2035 declaration preparation | No | No | Yes | Yes |
| URSSAF/CIPAV charge estimator | No | No | Yes | Yes |
| Multi-practitioner consolidated view | No | No | No | Yes |

## 6. Database Schema

### 6.1 New Table: `expenses`

```prisma
model Expense {
  id                  String            @id @default(uuid())
  psychologistId      String
  psychologist        Psychologist      @relation(fields: [psychologistId], references: [id])
  date                DateTime          @db.Date
  label               String
  amount              Decimal           @db.Decimal(10, 2)
  amountHt            Decimal?          @db.Decimal(10, 2)
  vatRate             Decimal?          @db.Decimal(4, 2)
  category            ExpenseCategory
  subcategory         String?
  paymentMethod       ExpensePaymentMethod
  supplier            String?
  receiptUrl          String?
  recurringExpenseId  String?
  recurringExpense    RecurringExpense?  @relation(fields: [recurringExpenseId], references: [id])
  notes               String?           // **Encrypted AES-256-GCM** (may contain sensitive context)
  isDeductible        Boolean           @default(true)
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  deletedAt           DateTime?         // Soft-delete only once accounting entry exists

  accountingEntries   AccountingEntry[]

  @@index([psychologistId, date(sort: Desc)], name: "idx_expenses_psy_date")
  @@index([psychologistId, category], name: "idx_expenses_psy_category")
  @@map("expenses")
}
```

> **Note on `Expense.notes` encryption (I2):** The `notes` field is encrypted with AES-256-GCM via the existing `EncryptionService`, consistent with the defense-in-depth approach used for all free-text fields in the codebase. While expense notes are financial (not health data), a psychologist might inadvertently include patient-identifiable information.

### 6.2 New Table: `recurring_expenses`

```prisma
model RecurringExpense {
  id              String            @id @default(uuid())
  psychologistId  String
  psychologist    Psychologist      @relation(fields: [psychologistId], references: [id])
  label           String
  amount          Decimal           @db.Decimal(10, 2)
  category        ExpenseCategory
  paymentMethod   PaymentMethod
  supplier        String?
  frequency       RecurringFrequency
  dayOfMonth      Int               @default(1)
  startDate       DateTime          @db.Date
  endDate         DateTime?         @db.Date
  isActive        Boolean           @default(true)
  lastGeneratedAt DateTime?         @db.Date
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  expenses        Expense[]

  @@index([psychologistId], name: "idx_recurring_psy")
  @@index([isActive, lastGeneratedAt], name: "idx_recurring_active")
  @@map("recurring_expenses")
}
```

### 6.3 New Table: `accounting_entries`

The unified ledger combining income and expenses chronologically.

```prisma
model AccountingEntry {
  id              String    @id @default(uuid())
  psychologistId  String
  psychologist    Psychologist @relation(fields: [psychologistId], references: [id])
  date            DateTime  @db.Date
  entryType       AccountingEntryType
  label           String
  debit           Decimal   @db.Decimal(10, 2)  @default(0)
  credit          Decimal   @db.Decimal(10, 2)  @default(0)
  category        String
  paymentMethod   String?
  counterpart     String?
  invoiceId       String?
  invoice         Invoice?  @relation(fields: [invoiceId], references: [id])
  paymentId       String?
  payment         Payment?  @relation(fields: [paymentId], references: [id])
  expenseId       String?
  expense         Expense?  @relation(fields: [expenseId], references: [id])
  accountCode     String?
  pieceRef        String?
  ecritureNum     Int?                          // FEC sequential number (per psychologist+year)
  fiscalYear      Int                           // Explicit fiscal year for reliable FEC/2035 queries
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?                     // Soft-delete only — accounting records are never hard-deleted (10-year retention)

  @@index([psychologistId, date(sort: Desc)], name: "idx_accounting_psy_date")
  @@index([psychologistId, entryType, date], name: "idx_accounting_psy_type_date")
  @@index([invoiceId], name: "idx_accounting_invoice")
  @@index([paymentId], name: "idx_accounting_payment")
  @@index([expenseId], name: "idx_accounting_expense")
  @@index([psychologistId, fiscalYear], name: "idx_accounting_psy_year")
  @@map("accounting_entries")
}
```

### 6.3b New Table: `fec_sequences` (FEC numbering persistence)

Ensures FEC `EcritureNum` is strictly sequential with no gaps per psychologist per fiscal year.

```prisma
model FecSequence {
  id              String @id @default(uuid())
  psychologistId  String
  year            Int
  lastNumber      Int    @default(0)

  @@unique([psychologistId, year])
  @@map("fec_sequences")
}
```

When creating an `AccountingEntry`, the service increments `FecSequence.lastNumber` atomically (inside a transaction) and assigns the result to `AccountingEntry.ecritureNum`. Soft-deleted entries keep their number — gaps are acceptable per DGFIP tolerance, but reuse is forbidden.

### 6.3c Required Reverse Relations

The following existing models must be updated with reverse relations:

```prisma
// In Psychologist model — add:
expenses            Expense[]
recurringExpenses   RecurringExpense[]
accountingEntries   AccountingEntry[]

// In Invoice model — add:
accountingEntries   AccountingEntry[]

// In Payment model — add:
accountingEntries   AccountingEntry[]
```

### 6.4 New Enums

```prisma
enum ExpenseCategory {
  RENT                    // Loyer et charges
  INSURANCE               // Assurances (RCP, multirisque)
  EQUIPMENT               // Materiel professionnel
  IT_SOFTWARE             // Informatique et logiciels
  PHONE_INTERNET          // Telephone et Internet
  TRAINING                // Formation continue
  SUPERVISION             // Supervision professionnelle
  PROFESSIONAL_FEES       // Cotisations professionnelles
  TRANSPORT               // Deplacements professionnels
  OFFICE_SUPPLIES         // Fournitures de bureau
  TESTS_TOOLS             // Tests et outils psychologiques
  BANK_FEES               // Frais bancaires
  ACCOUNTING              // Comptabilite / AGA
  CLEANING                // Entretien locaux
  OTHER                   // Autres charges
}

enum ExpensePaymentMethod {
  CASH                    // Especes
  CHECK                   // Cheque
  CARD                    // Carte bancaire
  TRANSFER                // Virement
  DIRECT_DEBIT            // Prelevement
  STRIPE                  // Paiement en ligne Stripe
  OTHER                   // Autre
}

enum RecurringFrequency {
  MONTHLY
  QUARTERLY
  YEARLY
}

enum AccountingEntryType {
  INCOME
  EXPENSE
}
```

### 6.5 BNC Account Code Mapping

Mapping from internal categories to standard BNC account codes (plan comptable professions liberales):

```typescript
const BNC_ACCOUNT_CODES: Record<string, { code: string; label: string }> = {
  // INCOME
  'HONORAIRES':           { code: '706000', label: 'Honoraires' },

  // EXPENSES
  'RENT':                 { code: '613200', label: 'Locations immobilieres' },
  'INSURANCE':            { code: '616000', label: 'Primes d\'assurance' },
  'EQUIPMENT':            { code: '218400', label: 'Materiel de bureau et informatique' },
  'IT_SOFTWARE':          { code: '651000', label: 'Redevances et logiciels' },
  'PHONE_INTERNET':       { code: '626000', label: 'Frais postaux et telecommunications' },
  'TRAINING':             { code: '618500', label: 'Seminaires, conferences, formations' },
  'SUPERVISION':          { code: '622600', label: 'Honoraires ne constituant pas des retrocessions' },
  'PROFESSIONAL_FEES':    { code: '628100', label: 'Cotisations syndicales et professionnelles' },
  'TRANSPORT':            { code: '625100', label: 'Voyages et deplacements' },
  'OFFICE_SUPPLIES':      { code: '606400', label: 'Fournitures de bureau' },
  'TESTS_TOOLS':          { code: '606800', label: 'Autres matieres et fournitures' },
  'BANK_FEES':            { code: '627000', label: 'Frais bancaires' },
  'ACCOUNTING':           { code: '622700', label: 'Frais d\'actes et de contentieux' },
  'CLEANING':             { code: '615500', label: 'Entretien et reparations' },
  'OTHER':                { code: '671000', label: 'Charges diverses' },

  // Additional common entries (not mapped to ExpenseCategory but available for advanced use)
  'CFE':                  { code: '635100', label: 'Cotisation fonciere des entreprises' },
  'RETROCESSION':         { code: '621100', label: 'Retrocession d\'honoraires' },
};
```

## 7. API Routes

### 7.1 Expenses Module

```
POST   /expenses                    Create expense (body: CreateExpenseDto)
GET    /expenses                    List expenses (query: page, limit, category, dateFrom, dateTo, search)
GET    /expenses/:id                Get expense detail
PUT    /expenses/:id                Update expense
DELETE /expenses/:id                Soft-delete expense (sets deletedAt, also soft-deletes linked AccountingEntry)
POST   /expenses/:id/receipt        Upload receipt file (multipart, max 10MB, jpg/png/pdf)
GET    /expenses/:id/receipt        Download receipt file (signed URL)
```

**CreateExpenseDto:**
```typescript
{
  date: string;          // ISO date
  label: string;         // min 2, max 200
  amount: number;        // > 0, max 2 decimals
  amountHt?: number;
  vatRate?: number;       // 0 | 5.5 | 10 | 20
  category: ExpenseCategory;
  subcategory?: string;
  paymentMethod: ExpensePaymentMethod;
  supplier?: string;
  notes?: string;
  isDeductible?: boolean;
}
```

### 7.2 Recurring Expenses Module

```
POST   /recurring-expenses          Create recurring expense
GET    /recurring-expenses          List active recurring expenses
PUT    /recurring-expenses/:id      Update recurring expense
DELETE /recurring-expenses/:id      Deactivate (set isActive=false, keep history)
POST   /recurring-expenses/generate Manually trigger generation for current month (admin/debug)
```

**CreateRecurringExpenseDto:**
```typescript
{
  label: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: ExpensePaymentMethod;
  supplier?: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  dayOfMonth: number;    // 1-31 (if month has fewer days, uses last valid day)
  startDate: string;     // ISO date
  endDate?: string;
}
```

### 7.3 Accounting Module

```
GET    /accounting/book             Unified ledger (query: page, limit, type, dateFrom, dateTo, category)
GET    /accounting/summary          Financial summary for a period
GET    /accounting/dashboard        Advanced dashboard data (P&L, categories, trends)
GET    /accounting/export/csv       Export CSV (query: dateFrom, dateTo, type)
GET    /accounting/export/fec       Export FEC normalized file (query: year)
GET    /accounting/tax-prep/2035    2035 declaration data (query: year)
GET    /accounting/social-charges   URSSAF/CIPAV estimator (query: year)
```

**Summary response:**
```typescript
{
  period: { from: string; to: string };
  income: { total: number; count: number; byMethod: Record<string, number> };
  expenses: { total: number; count: number; byCategory: Record<string, number> };
  netResult: number;
  estimatedSocialCharges: number;
  estimatedTax: number;
}
```

**Dashboard response:**
```typescript
{
  monthlyPnL: Array<{ month: string; income: number; expenses: number; net: number }>;
  expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
  incomeByMethod: Array<{ method: string; amount: number; percentage: number }>;
  yearToDate: { income: number; expenses: number; net: number };
  previousYear: { income: number; expenses: number; net: number };
  trend: number; // % change vs previous year
}
```

## 8. Backend Architecture

### 8.1 NestJS Modules

```
src/
  accounting/
    accounting.module.ts
    accounting.controller.ts
    accounting.service.ts          // Ledger queries, summaries, dashboard
    fec-export.service.ts          // FEC file generation (18-column norm)
    tax-prep.service.ts            // 2035 preparation, social charge estimation
  expenses/
    expenses.module.ts
    expenses.controller.ts
    expenses.service.ts            // CRUD + receipt upload
    dto/
      create-expense.dto.ts
      update-expense.dto.ts
  recurring-expenses/
    recurring-expenses.module.ts
    recurring-expenses.controller.ts
    recurring-expenses.service.ts  // CRUD + generation logic
    recurring-expenses.cron.ts     // Daily CRON to generate due expenses
```

### 8.2 Accounting Entry Generation

**Income entries** are created automatically via Prisma middleware or event hooks:

1. When an `Invoice` status changes to `paid` → create `AccountingEntry(type: INCOME)`
2. When a `Payment` status changes to `paid` → create `AccountingEntry(type: INCOME)` (if no linked invoice to avoid duplicates)

Logic to avoid duplicates:
- If a Payment is linked to an Invoice, only the Invoice triggers the entry
- If a Payment has no linked Invoice (e.g., cash payment marked via `markPaidOnSite`), the Payment triggers the entry
- Idempotency: check if an entry already exists for the same invoiceId or paymentId before creating

**Expense entries** are created:
1. When a new `Expense` is created → create `AccountingEntry(type: EXPENSE)` with `ecritureNum` from `FecSequence`
2. When an `Expense` is updated → update the linked `AccountingEntry` (amount, label, category only — `ecritureNum` never changes)
3. When an `Expense` is soft-deleted → soft-delete the linked `AccountingEntry` (set `deletedAt`, keep `ecritureNum` — never reused)

### 8.3 Recurring Expense CRON

A daily CRON job (e.g., 02:00 UTC) checks all active `RecurringExpense` records:

```typescript
// Pseudo-code
for each recurringExpense where isActive = true:
  if shouldGenerate(recurringExpense, today):
    create Expense from recurringExpense template
    update recurringExpense.lastGeneratedAt = today
    create AccountingEntry(type: EXPENSE)
    log audit event
```

`shouldGenerate` logic:
- MONTHLY: generate if today.day >= min(dayOfMonth, lastDayOfMonth) AND lastGeneratedAt < currentMonth
- QUARTERLY: generate if today.day >= min(dayOfMonth, lastDayOfMonth) AND lastGeneratedAt < currentQuarter
- YEARLY: generate if today.month/day >= startDate.month/min(dayOfMonth, lastDayOfMonth) AND lastGeneratedAt < currentYear

Note: `min(dayOfMonth, lastDayOfMonth)` ensures that a recurring expense set to day 31 generates on day 30 in April, day 28/29 in February, etc.

### 8.4 FEC Export Format

The FEC file is a pipe-delimited text file (`.txt`) with exactly 18 columns:

```
JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcrtureLet|DateLet|ValidDate|Montantdevise|Idevise
```

Mapping from AccountingEntry:
- `JournalCode`: "BQ" (banque) for most entries, "OD" for adjustments
- `JournalLib`: "Journal de banque" / "Operations diverses"
- `EcritureNum`: Sequential number per year (reset each January 1st)
- `EcritureDate`: entry.date (format: YYYYMMDD)
- `CompteNum`: entry.accountCode (from BNC_ACCOUNT_CODES mapping)
- `CompteLib`: Account label
- `CompAuxNum`: Patient ID or supplier reference (if applicable)
- `CompAuxLib`: Patient name or supplier name
- `PieceRef`: Invoice number or expense reference
- `PieceDate`: Same as EcritureDate for cash-basis
- `EcritureLib`: entry.label
- `Debit`: entry.debit (format: with comma decimal separator)
- `Credit`: entry.credit
- `EcrtureLet`: Empty (lettrage not applicable for simple BNC)
- `DateLet`: Empty
- `ValidDate`: entry.createdAt (validation date)
- `Montantdevise`: 0,00 (EUR only)
- `Idevise`: EUR

### 8.5 Social Charges Estimator

Based on 2025/2026 rates for psychologists (CIPAV regime):

```typescript
function estimateSocialCharges(netProfit: number): SocialChargesEstimate {
  return {
    urssaf: {
      maladie: netProfit * 0.066,           // 6.6% (base)
      allocationsFamiliales: netProfit * 0.031, // 3.1%
      csgCrds: netProfit * 0.097,           // 9.7%
      cfp: netProfit * 0.0025,              // 0.25%
    },
    cipav: {
      retraiteBase: calculateRetraiteBase(netProfit),  // Tranches
      retraiteComplementaire: calculateRetraiteCompl(netProfit),
      invaliditeDeces: 76, // Forfait classe A (default)
    },
    total: sum,
    monthlyProvision: sum / 12,
  };
}
```

Note: Rates are approximate and should include a disclaimer: "Estimation indicative. Consultez votre URSSAF/CIPAV pour les montants exacts."

### 8.6 2035 Declaration Preparation

Pre-fills the main lines of the declaration 2035:

```typescript
interface Declaration2035Prep {
  year: number;
  // Recettes (ligne AA)
  honoraires: number;         // Total income from sessions
  // Depenses ventilees
  achats: number;             // Ligne BA: Tests, fournitures
  loyersCharges: number;      // Ligne BB: Loyer, charges
  personnelExterieur: number; // Ligne BC: 0 for most psys
  impotsTaxes: number;        // Ligne BD: CFE, etc
  csgDeductible: number;      // Ligne BE: CSG deductible portion
  loyerCredit: number;        // Ligne BF: Credit-bail (rare)
  autresFrais: number;        // Ligne BG: Assurances, frais divers
  transports: number;         // Ligne BH: Deplacements
  chargesSociales: number;    // Ligne BK: URSSAF + CIPAV
  fraisReception: number;     // Ligne BL: Repas, cadeaux
  fournitures: number;        // Ligne BM: Bureau, petit materiel
  fraisActes: number;         // Ligne BN: Comptable, AGA
  autresDepenses: number;     // Ligne BP: Divers
  totalDepenses: number;      // Ligne BQ: Sum
  beneficeNet: number;        // Ligne CP: honoraires - totalDepenses
  // Informations complementaires
  cga: boolean;               // Adherent CGA?
  disclaimer: string;
}
```

## 9. Frontend Architecture

### 9.1 New Pages

```
apps/web/src/app/(dashboard)/dashboard/
  accounting/
    page.tsx                    // Main accounting page (tabs: income, expenses, ledger)
    reports/
      page.tsx                  // Reports & exports (dashboard, CSV, FEC, 2035)
```

### 9.2 New Components

```
apps/web/src/components/accounting/
  accounting-page.tsx           // Main page component with tabs
  income-book.tsx               // Livre des recettes (auto-populated)
  expense-list.tsx              // Expense list with filters
  expense-form-dialog.tsx       // Create/edit expense modal
  recurring-expenses-card.tsx   // Recurring expenses configuration
  accounting-ledger.tsx         // Unified livre-journal view
  financial-summary-card.tsx    // Monthly/annual summary widget
  financial-dashboard.tsx       // Advanced P&L charts (Pro/Clinic)
  expense-category-badge.tsx    // Category display with icon/color
  export-section.tsx            // CSV/FEC export buttons
  tax-prep-panel.tsx            // 2035 preparation view (Pro/Clinic)
  social-charges-card.tsx       // URSSAF/CIPAV estimator (Pro/Clinic)
```

### 9.3 New API Client

```
apps/web/src/lib/api/
  accounting.ts                 // accountingApi: book, summary, dashboard, exports
  expenses.ts                   // expensesApi: CRUD + receipt upload
  recurring-expenses.ts         // recurringExpensesApi: CRUD
```

### 9.4 Sidebar Navigation

Add accounting entries to the existing "Gestion" sidebar group (which already contains Paiements, Factures, Analytiques):

```
Gestion
  ...existing items...
  Comptabilite         /dashboard/accounting
  Rapports & Exports   /dashboard/accounting/reports
```

This avoids creating a separate group and keeps all financial tools together.

### 9.5 UX Details

**Income Book (Livre des recettes):**
- Auto-populated from paid invoices/payments
- Read-only (income comes from the existing invoice/payment flow)
- Columns: Date, Patient, Description, Amount, Payment Method, Invoice #
- Filters: month/quarter/year selector, search by patient
- Monthly totals displayed at bottom of each month section

**Expense List:**
- Sortable/filterable table
- Quick-add button opens slide-in dialog (not full page navigation)
- Category icons and color badges for visual scanning
- Receipt indicator (paperclip icon) if justificatif attached
- Bulk actions: delete selected

**Expense Form Dialog:**
- Fields: date, label, amount, category (dropdown with icons), payment method, supplier, notes
- Optional: amount HT + VAT rate (auto-calculates TTC)
- Receipt upload: drag-and-drop or click (jpg/png/pdf, max 10MB)
- Pre-fills date to today, payment method to last used
- Validation: Zod schema

**Recurring Expenses Card:**
- List of active recurrences with: label, amount, frequency, next generation date
- Toggle to activate/deactivate
- Add/edit dialog
- Visual indicator: "Prochaine generation: 1er mai 2026"
- Feature-locked for Free/Solo plans with upgrade CTA

**Financial Dashboard (Reports page):**
- **Summary cards:** Total income, Total expenses, Net result, Monthly provision
- **Bar chart:** Monthly income vs expenses (12 months)
- **Pie chart:** Expenses by category
- **Table:** Monthly P&L breakdown
- **2035 Section (Pro/Clinic):** Pre-filled declaration fields with "Copy" buttons
- **Social Charges Section (Pro/Clinic):** Estimated URSSAF + CIPAV with monthly provision
- **Export buttons:** "Telecharger CSV", "Telecharger FEC", "Preparer 2035"

## 10. Receipt Storage (Justificatifs)

Receipts are stored on AWS S3 (eu-west-3, HDS-compliant):
- Bucket: `psylib-receipts-{env}` (private, SSE-KMS encrypted)
- Key: `{psychologistId}/receipts/{expenseId}/{filename}`
- Access: Signed URLs only (15-minute expiry)
- Max size: 10MB per file
- Accepted formats: JPEG, PNG, PDF
- Not encrypted at application level (unlike patient notes) — receipts are financial, not health data

## 11. Data Flow Diagrams

### Income Flow (automatic)
```
Invoice.status → 'paid'
    ↓ (Prisma event / service hook)
AccountingService.createIncomeEntry({
  date: invoice.paidAt,
  label: "Consultation {patient.name}",
  credit: invoice.amountTtc,
  counterpart: patient.name,
  invoiceId: invoice.id,
  accountCode: '706000',
  pieceRef: invoice.invoiceNumber,
  paymentMethod: detectMethod(invoice/payment)
})
    ↓
AccountingEntry created (type: INCOME)
```

### Expense Flow (manual)
```
User fills ExpenseFormDialog
    ↓
POST /expenses (CreateExpenseDto)
    ↓
ExpensesService.create()
    ↓ (within same transaction)
AccountingService.createExpenseEntry({
  date: expense.date,
  label: expense.label,
  debit: expense.amount,
  counterpart: expense.supplier,
  expenseId: expense.id,
  accountCode: BNC_ACCOUNT_CODES[expense.category].code,
  paymentMethod: expense.paymentMethod
})
    ↓
Expense + AccountingEntry created
```

### Recurring Expense Flow (CRON)
```
Daily CRON (02:00 UTC)
    ↓
RecurringExpensesCron.handleCron()
    ↓
For each active RecurringExpense due today:
    ↓
Create Expense (from template) + AccountingEntry
Update lastGeneratedAt
Audit log: RECURRING_EXPENSE_GENERATED
```

## 12. Testing Strategy

### Unit Tests (Vitest)
- `AccountingService`: entry creation, deduplication, summary calculation
- `FecExportService`: FEC file generation, column formatting, date formats
- `TaxPrepService`: 2035 field calculation, category-to-line mapping
- `SocialChargesService`: URSSAF/CIPAV rate calculation
- `RecurringExpensesCron`: generation logic (monthly/quarterly/yearly), edge cases

### Integration Tests (Supertest)
- `POST /expenses` — create expense, verify AccountingEntry created
- `GET /accounting/book` — verify income + expenses unified
- `GET /accounting/export/fec` — verify FEC format compliance
- `GET /accounting/export/csv` — verify CSV structure
- Invoice paid → verify income entry auto-created
- Recurring expense generation → verify expense + entry created
- Plan gating: Free user cannot upload receipts, Solo cannot create recurring

### E2E Tests (Playwright)
- Full accounting page load and navigation
- Create expense via dialog, verify appears in list and ledger
- Configure recurring expense, verify generation
- Export CSV download
- Plan upgrade prompts for locked features

## 13. Migration Plan

### Database Migration

```sql
-- Create enums
CREATE TYPE "ExpenseCategory" AS ENUM (
  'RENT', 'INSURANCE', 'EQUIPMENT', 'IT_SOFTWARE', 'PHONE_INTERNET',
  'TRAINING', 'SUPERVISION', 'PROFESSIONAL_FEES', 'TRANSPORT',
  'OFFICE_SUPPLIES', 'TESTS_TOOLS', 'BANK_FEES', 'ACCOUNTING',
  'CLEANING', 'OTHER'
);

CREATE TYPE "PaymentMethod" AS ENUM (
  'CASH', 'CHECK', 'CARD', 'TRANSFER', 'DIRECT_DEBIT', 'STRIPE', 'OTHER'
);

CREATE TYPE "RecurringFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

CREATE TYPE "AccountingEntryType" AS ENUM ('INCOME', 'EXPENSE');

-- Create tables (schema managed by Prisma — SQL shown for reference)
CREATE TABLE IF NOT EXISTS "expenses" (...);           -- includes deletedAt, encrypted notes
CREATE TABLE IF NOT EXISTS "recurring_expenses" (...);
CREATE TABLE IF NOT EXISTS "accounting_entries" (...);  -- includes ecritureNum, fiscalYear, deletedAt
CREATE TABLE IF NOT EXISTS "fec_sequences" (...);       -- unique(psychologistId, year)

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_expenses_psy_date" ON "expenses"("psychologistId", "date" DESC);
CREATE INDEX IF NOT EXISTS "idx_expenses_psy_category" ON "expenses"("psychologistId", "category");
CREATE INDEX IF NOT EXISTS "idx_recurring_psy" ON "recurring_expenses"("psychologistId");
CREATE INDEX IF NOT EXISTS "idx_recurring_active" ON "recurring_expenses"("isActive", "lastGeneratedAt");
CREATE INDEX IF NOT EXISTS "idx_accounting_psy_date" ON "accounting_entries"("psychologistId", "date" DESC);
CREATE INDEX IF NOT EXISTS "idx_accounting_psy_type_date" ON "accounting_entries"("psychologistId", "entryType", "date");
CREATE INDEX IF NOT EXISTS "idx_accounting_invoice" ON "accounting_entries"("invoiceId");
CREATE INDEX IF NOT EXISTS "idx_accounting_payment" ON "accounting_entries"("paymentId");
CREATE INDEX IF NOT EXISTS "idx_accounting_expense" ON "accounting_entries"("expenseId");
CREATE INDEX IF NOT EXISTS "idx_accounting_psy_year" ON "accounting_entries"("psychologistId", "fiscalYear");
```

### Backfill Script

After migration, run a one-time backfill to populate `accounting_entries` from existing paid invoices and payments:

```typescript
// Backfill: populate_accounting_entries.ts
// - IDEMPOTENT: safe to re-run (checks existing entries before creating)
// - BATCHED: processes 100 psychologists at a time in transactions
// - DRY-RUN mode: set DRY_RUN=true to preview without committing
// - LOGGED: outputs created/skipped/error counts per psychologist
//
// For each psychologist (batched):
//   BEGIN TRANSACTION
//   1. Get all paid invoices without existing AccountingEntry(invoiceId)
//      → create INCOME entries with ecritureNum from FecSequence
//   2. Get all paid payments where payment.invoiceId IS NULL
//      and no existing AccountingEntry(paymentId)
//      → create INCOME entries (avoid duplicates with invoice-linked payments)
//   3. Initialize FecSequence for each year touched
//   COMMIT TRANSACTION
//
// Error handling: if one psychologist fails, log error, skip, continue with next batch.
// Summary output: { total: N, created: N, skipped: N, errors: N }
```

## 14. Security & Compliance

- **Tenant isolation**: All queries filtered by `psychologistId` (existing pattern)
- **Audit logging**: CRUD operations on expenses logged to `audit_logs`
- **Receipt encryption**: S3 SSE-KMS (at-rest), TLS 1.3 (in-transit), signed URLs (access)
- **Patient names in accounting entries**: Income entries include patient names in `label` and `counterpart` fields. This is **legally required** for the livre des recettes (Article 99 of the CGI requires identifying the client). Patient names are not health data. The FEC export also includes patient names in `EcritureLib` and `CompAuxLib` columns. Phase 2 enhancement: offer an anonymization option for exports shared with external accountants.
- **FEC compliance**: File format validated against DGFIP specifications. `EcritureNum` is strictly sequential per psychologist per fiscal year, persisted via `fec_sequences` table. Soft-deleted entries keep their number (gaps tolerated, reuse forbidden).
- **Data retention**: 10-year retention for accounting entries, expenses, and receipts (legal requirement). All deletions are soft-deletes (`deletedAt` timestamp). Hard deletion is never performed.
- **Expense notes encryption**: `Expense.notes` is encrypted with AES-256-GCM (consistent with all free-text fields in the codebase) to prevent inadvertent PII leakage.

## 15. Shared Types Updates

Add to `packages/shared-types/src/index.ts`:

```typescript
// Expense types
export enum ExpenseCategory { ... }
export enum ExpensePaymentMethod { ... }
export enum RecurringFrequency { ... }
export enum AccountingEntryType { ... }

// Expense category labels (French)
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: 'Loyer et charges',
  INSURANCE: 'Assurances',
  EQUIPMENT: 'Materiel professionnel',
  IT_SOFTWARE: 'Informatique et logiciels',
  PHONE_INTERNET: 'Telephone et Internet',
  TRAINING: 'Formation continue',
  SUPERVISION: 'Supervision',
  PROFESSIONAL_FEES: 'Cotisations professionnelles',
  TRANSPORT: 'Deplacements',
  OFFICE_SUPPLIES: 'Fournitures de bureau',
  TESTS_TOOLS: 'Tests et outils',
  BANK_FEES: 'Frais bancaires',
  ACCOUNTING: 'Comptabilite / AGA',
  CLEANING: 'Entretien locaux',
  OTHER: 'Autres charges',
};

// Plan feature check
export function canUploadReceipts(plan: SubscriptionPlan): boolean;
export function canCreateRecurringExpenses(plan: SubscriptionPlan): boolean;
export function canExportFEC(plan: SubscriptionPlan): boolean;
export function canPrep2035(plan: SubscriptionPlan): boolean;
export function canEstimateSocialCharges(plan: SubscriptionPlan): boolean;
export function getExpenseLimit(plan: SubscriptionPlan): number | null;

// Update PLAN_LIMITS to include expenses:
// FREE: { expenses: 30 }   (30 per month)
// STARTER: { expenses: null }
// PRO: { expenses: null }
// CLINIC: { expenses: null }
```

### 15.1 Plan Enforcement: Expense Limit

Add to `SubscriptionService`:
```typescript
async checkExpenseLimit(psychologistId: string): Promise<void> {
  const sub = await this.getSubscription(psychologistId);
  const limit = PLAN_LIMITS[sub.plan]?.expenses;
  if (limit === null || limit === undefined) return; // Unlimited
  const count = await this.prisma.expense.count({
    where: {
      psychologistId,
      deletedAt: null,
      createdAt: { gte: startOfMonth(new Date()) },
    },
  });
  if (count >= limit) {
    throw new ForbiddenException({
      code: 'EXPENSE_LIMIT_REACHED',
      current: count,
      limit,
      message: `Limite de ${limit} depenses/mois atteinte. Passez au plan Solo pour un suivi illimite.`,
    });
  }
}
```

Also add `'expenses'` to the `BillingFeature` type in `require-plan.decorator.ts`.

## 16. Performance Considerations

- **Accounting entries pagination**: Default 50 per page, max 200
- **Summary/dashboard queries**: Use PostgreSQL aggregation functions, not in-memory
- **FEC export**: Stream the file (can be large for multi-year exports)
- **CSV export**: Stream with chunked response
- **Recurring CRON**: Process in batches of 100, with error isolation per expense
- **Index strategy**: Composite indexes on (psychologistId, date) for all tables

## 17. Open Questions / Future Enhancements

1. **Bank synchronization** (Phase 2): GoCardless Bank Account Data API for automatic transaction import and reconciliation
2. **OCR receipt scanning** (Phase 2): Claude Vision API to extract data from receipt photos
3. **Multi-currency support**: Not needed for French psys (EUR only) but could be useful for international expansion
4. **Immobilisations register**: Required for declaration controlee; could be a future addition
5. **Integration with Indy/Tiime API**: For psys who want to keep their external accountant's tool
6. **VAT management for mixed activities**: Training/coaching revenue subject to VAT — manual workaround for now
