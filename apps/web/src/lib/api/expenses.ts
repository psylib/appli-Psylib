import { apiClient } from './client';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

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
  updatedAt: string;
}

export interface CreateExpensePayload {
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

export interface ExpenseListQuery {
  page?: number;
  limit?: number;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const expensesApi = {
  list: (token: string, query?: ExpenseListQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.category) params.set('category', query.category);
    if (query?.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query?.dateTo) params.set('dateTo', query.dateTo);
    if (query?.search) params.set('search', query.search);
    return apiClient.get<ExpenseRecord[]>(`/expenses?${params}`, token);
  },

  get: (id: string, token: string) =>
    apiClient.get<ExpenseRecord>(`/expenses/${id}`, token),

  create: (data: CreateExpensePayload, token: string) =>
    apiClient.post<ExpenseRecord>('/expenses', data, token),

  update: (id: string, data: Partial<CreateExpensePayload>, token: string) =>
    apiClient.put<ExpenseRecord>(`/expenses/${id}`, data, token),

  delete: (id: string, token: string) =>
    apiClient.delete<{ deleted: boolean }>(`/expenses/${id}`, token),

  uploadReceipt: async (id: string, file: File, token: string): Promise<{ receiptUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/v1/expenses/${id}/receipt`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error(`Erreur upload justificatif (${res.status})`);
    return res.json() as Promise<{ receiptUrl: string }>;
  },

  getReceiptUrl: (id: string, token: string) =>
    apiClient.get<{ receiptUrl: string }>(`/expenses/${id}/receipt`, token),
};
