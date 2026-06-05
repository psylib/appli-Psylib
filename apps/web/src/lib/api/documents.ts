import { apiClient } from './client';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface SharedDocumentSummary {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  createdAt: string;
}

/** Liste les documents partagés avec un patient (psy authentifié). */
export async function listDocuments(patientId: string, token: string): Promise<SharedDocumentSummary[]> {
  // GET /documents est paginé : renvoie { data, total }.
  const body = await apiClient.get<{ data: SharedDocumentSummary[]; total: number }>(
    `/documents?patientId=${encodeURIComponent(patientId)}`,
    token,
  );
  return body.data ?? [];
}

/** Télécharge les octets d'un document (psy authentifié). */
export async function downloadDocumentBytes(
  id: string,
  token: string,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const res = await fetch(`${API_BASE}/api/v1/documents/${id}/download`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Téléchargement échoué (${res.status})`);
  const mimeType = res.headers.get('Content-Type') ?? 'application/octet-stream';
  const buf = await res.arrayBuffer();
  return { bytes: new Uint8Array(buf), mimeType };
}
