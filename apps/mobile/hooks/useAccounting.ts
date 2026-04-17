/**
 * useAccounting — React Query hooks pour la comptabilité
 * Endpoints: /accounting/*, /expenses
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

// ── Types ──────────────────────────────────────────────

export interface AccountingDashboard {
  currentYear: {
    revenue: number;
    expenses: number;
    netIncome: number;
    vatCollected: number;
    vatDeductible: number;
    vatBalance: number;
    expensesByCategory: Record<string, number>;
    revenueByMonth: Array<{ month: string; amount: number }>;
    expensesByMonth: Array<{ month: string; amount: number }>;
  };
  currentMonth: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };
  quarterlyRevenue: Array<{ quarter: string; amount: number }>;
  topExpenseCategories: Array<{ category: string; amount: number; percentage: number }>;
  pendingInvoices: number;
  pendingInvoicesAmount: number;
}

export interface AccountingEntry {
  id: string;
  date: string;
  type: string;
  label: string;
  amount: number;
  category: string | null;
  reference: string | null;
  patientName: string | null;
  invoiceNumber: string | null;
  expenseId: string | null;
  sessionId: string | null;
  invoiceId: string | null;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  label: string;
  amount: number;
  amountHt: number | null;
  vatRate: number | null;
  category: string;
  subcategory: string | null;
  paymentMethod: string;
  supplier: string | null;
  notes: string | null;
  isDeductible: boolean;
  receiptUrl: string | null;
  createdAt: string;
}

export interface CreateExpenseDto {
  date: string;
  label: string;
  amount: number;
  amountHt?: number;
  vatRate?: number;
  category: string;
  subcategory?: string;
  paymentMethod: string;
  supplier?: string;
  notes?: string;
  isDeductible?: boolean;
}

export interface TaxPrepData {
  year: number;
  totalRevenue: number;
  totalDeductibleExpenses: number;
  taxableIncome: number;
  urssafBase: number;
  estimatedSocialCharges: number;
  estimatedIncomeTax: number;
  quarterlyPayments: Array<{
    quarter: string;
    dueDate: string;
    amount: number;
    revenue: number;
  }>;
}

export interface SocialChargesData {
  year: number;
  totalRevenue: number;
  urssafRate: number;
  urssafAmount: number;
  cfpRate: number;
  cfpAmount: number;
  totalCharges: number;
  quarterlyBreakdown: Array<{
    quarter: string;
    revenue: number;
    charges: number;
  }>;
}

// ── Keys ───────────────────────────────────────────────

const ACCOUNTING_KEY = 'accounting';
const EXPENSES_KEY = 'expenses';

// ── Dashboard ──────────────────────────────────────────

export function useAccountingDashboard() {
  const { getValidToken } = useAuth();

  return useQuery<AccountingDashboard>({
    queryKey: [ACCOUNTING_KEY, 'dashboard'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<AccountingDashboard>('/accounting/dashboard', token ?? undefined);
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── Book ───────────────────────────────────────────────

export function useAccountingBook(params?: { page?: number; type?: string; category?: string }) {
  const { getValidToken } = useAuth();
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.type) qs.set('type', params.type);
  if (params?.category) qs.set('category', params.category);
  qs.set('limit', '50');

  return useQuery<{ entries: AccountingEntry[]; total: number }>({
    queryKey: [ACCOUNTING_KEY, 'book', params],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<{ entries: AccountingEntry[]; total: number }>(
        `/accounting/book?${qs}`,
        token ?? undefined,
      );
    },
    staleTime: 1000 * 60 * 2,
  });
}

// ── Expenses ───────────────────────────────────────────

export function useExpenses(category?: string) {
  const { getValidToken } = useAuth();
  const qs = new URLSearchParams();
  if (category) qs.set('category', category);
  qs.set('limit', '100');

  return useQuery<ExpenseRecord[]>({
    queryKey: [EXPENSES_KEY, category],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<ExpenseRecord[]>(`/expenses?${qs}`, token ?? undefined);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateExpense() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExpenseDto) => {
      const token = await getValidToken();
      return apiClient.post<ExpenseRecord>('/expenses', data, token ?? undefined);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [EXPENSES_KEY] });
      void qc.invalidateQueries({ queryKey: [ACCOUNTING_KEY] });
    },
  });
}

export function useDeleteExpense() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getValidToken();
      return apiClient.delete<void>(`/expenses/${id}`, token ?? undefined);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [EXPENSES_KEY] });
      void qc.invalidateQueries({ queryKey: [ACCOUNTING_KEY] });
    },
  });
}

// ── Reports ────────────────────────────────────────────

export function useTaxPrep(year: number) {
  const { getValidToken } = useAuth();

  return useQuery<TaxPrepData>({
    queryKey: [ACCOUNTING_KEY, 'tax-prep', year],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<TaxPrepData>(`/accounting/tax-prep?year=${year}`, token ?? undefined);
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useSocialCharges(year: number) {
  const { getValidToken } = useAuth();

  return useQuery<SocialChargesData>({
    queryKey: [ACCOUNTING_KEY, 'social-charges', year],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<SocialChargesData>(
        `/accounting/social-charges?year=${year}`,
        token ?? undefined,
      );
    },
    staleTime: 1000 * 60 * 10,
  });
}
