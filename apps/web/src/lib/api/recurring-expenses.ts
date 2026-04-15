import { apiClient } from './client';

export interface RecurringExpenseRecord {
  id: string;
  label: string;
  amount: number;
  category: string;
  paymentMethod: string;
  supplier: string | null;
  frequency: string;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  nextOccurrence: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringExpensePayload {
  label: string;
  amount: number;
  category: string;
  paymentMethod: string;
  supplier?: string;
  frequency: string;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
}

export const recurringExpensesApi = {
  list: (token: string) =>
    apiClient.get<RecurringExpenseRecord[]>('/recurring-expenses', token),

  get: (id: string, token: string) =>
    apiClient.get<RecurringExpenseRecord>(`/recurring-expenses/${id}`, token),

  create: (data: CreateRecurringExpensePayload, token: string) =>
    apiClient.post<RecurringExpenseRecord>('/recurring-expenses', data, token),

  update: (id: string, data: Partial<CreateRecurringExpensePayload>, token: string) =>
    apiClient.put<RecurringExpenseRecord>(`/recurring-expenses/${id}`, data, token),

  delete: (id: string, token: string) =>
    apiClient.delete<{ deleted: boolean }>(`/recurring-expenses/${id}`, token),
};
