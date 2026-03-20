/**
 * Invoices CRUD hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

interface Invoice {
  id: string;
  psychologistId: string;
  patientId?: string | null;
  invoiceNumber: string;
  amountTtc: number;
  status: 'draft' | 'sent' | 'paid';
  issuedAt: string;
  pdfUrl?: string | null;
  patient?: { id: string; name: string };
  createdAt: string;
}

interface CreateInvoiceDto {
  patientId?: string;
  amountTtc: number;
  issuedAt?: string;
  items?: { description: string; amount: number }[];
}

const INVOICES_KEY = 'invoices';

export function useInvoices(status?: string) {
  const { getValidToken } = useAuth();
  const params = status ? `?status=${status}` : '';

  return useQuery({
    queryKey: [INVOICES_KEY, status],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<Invoice[]>(`/invoices${params}`, token ?? undefined);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useInvoice(id: string) {
  const { getValidToken } = useAuth();

  return useQuery({
    queryKey: [INVOICES_KEY, id],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<Invoice>(`/invoices/${id}`, token ?? undefined);
    },
    enabled: id.length > 0,
  });
}

export function useCreateInvoice() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceDto) => {
      const token = await getValidToken();
      return apiClient.post<Invoice>('/invoices', data, token ?? undefined);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [INVOICES_KEY] });
    },
  });
}

export function useInvoicePdf(id: string) {
  const { getValidToken } = useAuth();

  return useQuery({
    queryKey: [INVOICES_KEY, id, 'pdf'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<{ url: string }>(`/invoices/${id}/pdf`, token ?? undefined);
    },
    enabled: false, // Only fetch on demand
  });
}
