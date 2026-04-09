import { apiClient } from './client';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  amountTtc: string;
  status: 'draft' | 'sent' | 'paid';
  issuedAt: string;
  pdfUrl: string | null;
  source: 'manual' | 'auto';
  paidAt: string | null;
  sessionId: string | null;
  patient: { id: string; name: string; email: string | null } | null;
}

export interface CreateInvoicePayload {
  patientId: string;
  sessions: string[];
  amountTtc: number;
  issuedAt: string;
}

export const invoicesApi = {
  list: (token: string) =>
    apiClient.get<InvoiceRecord[]>('/invoices', token),

  create: (data: CreateInvoicePayload, token: string) =>
    apiClient.post<InvoiceRecord>('/invoices', data, token),

  markAsSent: (id: string, token: string) =>
    apiClient.patch<InvoiceRecord>(`/invoices/${id}/send`, {}, token),

  markAsPaid: (id: string, token: string) =>
    apiClient.patch<InvoiceRecord>(`/invoices/${id}/mark-paid`, {}, token),

  /** Télécharge le PDF comme blob et déclenche le download navigateur */
  downloadPdf: async (id: string, invoiceNumber: string, token: string): Promise<void> => {
    const url = `${API_BASE}/api/v1/invoices/${id}/pdf`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Erreur téléchargement PDF');
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `facture-${invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(href);
  },
};
