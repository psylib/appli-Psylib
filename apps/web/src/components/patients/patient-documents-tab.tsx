'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShareDocumentDialog } from './share-document-dialog';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

type DocumentCategory = 'exercise' | 'administrative' | 'session_report' | 'other';

interface SharedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  category: DocumentCategory;
  message?: string;
  downloadedAt: string | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  exercise: 'Exercice',
  administrative: 'Administratif',
  session_report: 'Compte-rendu',
  other: 'Autre',
};

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';

const CATEGORY_BADGE_VARIANTS: Record<DocumentCategory, BadgeVariant> = {
  exercise: 'default',
  administrative: 'secondary',
  session_report: 'success',
  other: 'secondary',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

interface PatientDocumentsTabProps {
  patientId: string;
  patientName: string;
}

export function PatientDocumentsTab({ patientId, patientName }: PatientDocumentsTabProps) {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    const token = session?.accessToken;
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/v1/documents?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement des documents');
      const body = await res.json() as { data: SharedDocument[]; total: number };
      setDocuments(body.data ?? []);
      setTotal(body.total ?? 0);
    } catch {
      setError('Impossible de charger les documents');
    } finally {
      setLoading(false);
    }
  }, [patientId, session?.accessToken]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm(`Supprimer "${fileName}" ?`)) return;
    const token = session?.accessToken;
    if (!token) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${API}/api/v1/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      setError('Impossible de supprimer le document');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">
          Documents
          {total > 0 && (
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              ({total})
            </span>
          )}
        </h3>
        <Button size="sm" onClick={() => setShareOpen(true)}>
          <Plus size={14} />
          Partager un document
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-sm text-muted-foreground">Chargement des documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center space-y-2">
          <FileText size={32} className="mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aucun document partagé</p>
          <p className="text-xs text-muted-foreground">
            Partagez des exercices, comptes-rendus ou documents administratifs avec ce patient.
          </p>
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-white overflow-hidden shadow-sm divide-y divide-border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-4 p-4">
              {/* Icon */}
              <div className="shrink-0 rounded-lg bg-surface p-2">
                <FileText size={18} className="text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium text-foreground truncate"
                  title={doc.fileName}
                >
                  {doc.fileName}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={CATEGORY_BADGE_VARIANTS[doc.category]}>
                    {CATEGORY_LABELS[doc.category]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(doc.fileSize)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="shrink-0">
                {doc.downloadedAt ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Téléchargé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Non lu
                  </span>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => void handleDelete(doc.id, doc.fileName)}
                disabled={deletingId === doc.id}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                aria-label={`Supprimer ${doc.fileName}`}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ShareDocumentDialog
        patientId={patientId}
        patientName={patientName}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onSuccess={() => void fetchDocuments()}
      />
    </section>
  );
}
