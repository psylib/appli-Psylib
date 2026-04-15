import { apiClient } from './client';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

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

export interface AccountingSummary {
  revenue: number;
  expenses: number;
  netIncome: number;
  vatCollected: number;
  vatDeductible: number;
  vatBalance: number;
  expensesByCategory: Record<string, number>;
  revenueByMonth: Array<{ month: string; amount: number }>;
  expensesByMonth: Array<{ month: string; amount: number }>;
}

export interface AccountingDashboard {
  currentYear: AccountingSummary;
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

export interface AccountingBookQuery {
  page?: number;
  limit?: number;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
}

export const accountingApi = {
  getBook: (token: string, query?: AccountingBookQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.type) params.set('type', query.type);
    if (query?.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query?.dateTo) params.set('dateTo', query.dateTo);
    if (query?.category) params.set('category', query.category);
    return apiClient.get<{ entries: AccountingEntry[]; total: number; page: number; limit: number }>(`/accounting/book?${params}`, token);
  },

  getSummary: (token: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return apiClient.get<AccountingSummary>(`/accounting/summary?${params}`, token);
  },

  getDashboard: (token: string) =>
    apiClient.get<AccountingDashboard>('/accounting/dashboard', token),

  exportCsv: async (token: string, dateFrom: string, dateTo: string): Promise<Blob> => {
    const params = new URLSearchParams({ dateFrom, dateTo });
    const res = await fetch(`${API_BASE}/api/v1/accounting/export/csv?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Erreur export CSV (${res.status})`);
    return res.blob();
  },

  exportFec: async (token: string, year: number): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/api/v1/accounting/export/fec?year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Erreur export FEC (${res.status})`);
    return res.blob();
  },

  getTaxPrep: (token: string, year: number) =>
    apiClient.get<TaxPrepData>(`/accounting/tax-prep?year=${year}`, token),

  getSocialCharges: (token: string, year: number) =>
    apiClient.get<SocialChargesData>(`/accounting/social-charges?year=${year}`, token),
};
