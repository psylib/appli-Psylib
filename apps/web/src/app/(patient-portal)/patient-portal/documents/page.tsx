'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, Download } from 'lucide-react';
import { patientPortalApi, type SharedDocument } from '@/lib/api/patient-portal';

const CATEGORY_LABELS: Record<SharedDocument['category'], string> = {
  exercise: 'Exercice',
  administrative: 'Administratif',
  session_report: 'Compte-rendu',
  other: 'Autre',
};

const CATEGORY_COLORS: Record<SharedDocument['category'], string> = {
  exercise: 'bg-purple-50 text-purple-700 border-purple-200',
  administrative: 'bg-blue-50 text-blue-700 border-blue-200',
  session_report: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  other: 'bg-slate-50 text-slate-500 border-slate-200',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function DocumentCard({
  doc,
  onDownload,
}: {
  doc: SharedDocument;
  onDownload: (id: string) => Promise<void>;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(doc.downloadedAt !== null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload(doc.id);
      setDownloaded(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
          <FileText size={18} className="text-slate-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-900 truncate">{doc.fileName}</p>
            {!downloaded && (
              <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-0.5 shrink-0">
                Nouveau
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`text-xs border rounded-full px-2 py-0.5 ${CATEGORY_COLORS[doc.category]}`}
            >
              {CATEGORY_LABELS[doc.category]}
            </span>
            <span className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</span>
            <span className="text-xs text-slate-400">
              {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          {doc.message && (
            <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
              {doc.message}
            </p>
          )}
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="shrink-0 flex items-center gap-1.5 text-xs bg-[#3D52A0] text-white rounded-lg px-3 py-1.5 hover:bg-[#2d3f7c] transition-colors disabled:opacity-60"
        >
          <Download size={13} />
          {downloading ? '...' : 'Ouvrir'}
        </button>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    patientPortalApi
      .getDocuments(session.accessToken)
      .then(setDocuments)
      .catch(() => setError('Impossible de charger vos documents.'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const handleDownload = async (id: string) => {
    if (!session?.accessToken) return;
    await patientPortalApi.downloadDocument(session.accessToken, id);
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, downloadedAt: new Date().toISOString() } : d,
      ),
    );
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3 pb-24">
        <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mes documents</h1>
        <p className="text-sm text-slate-500 mt-0.5">Partagés par votre psychologue</p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
          <FileText size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">Aucun document pour le moment.</p>
          <p className="text-xs text-slate-400 mt-1">
            Votre psychologue peut partager des documents depuis votre dossier.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  );
}
