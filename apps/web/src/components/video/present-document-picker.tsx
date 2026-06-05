'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { listDocuments, downloadDocumentBytes, type SharedDocumentSummary } from '@/lib/api/documents';

const MAX_PRESENT_BYTES = 5 * 1024 * 1024; // 5 Mo
const PRESENTABLE = ['application/pdf', 'image/jpeg', 'image/png'];

interface Props {
  patientId: string;
  accessToken: string;
  onPresent: (meta: { fileName: string; mimeType: string }, bytes: Uint8Array) => void;
}

export function PresentDocumentPicker({ patientId, accessToken, onPresent }: Props) {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<SharedDocumentSummary[] | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || docs) return;
    listDocuments(patientId, accessToken)
      .then(setDocs)
      .catch(() => setDocs([]));
  }, [open, docs, patientId, accessToken]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handlePick = async (doc: SharedDocumentSummary) => {
    setLoadingId(doc.id);
    try {
      const { bytes, mimeType } = await downloadDocumentBytes(doc.id, accessToken);
      onPresent({ fileName: doc.fileName, mimeType: mimeType || doc.mimeType }, bytes);
      setOpen(false);
    } catch (err) {
      console.error('[present-doc] download failed', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
        title="Présenter un document"
      >
        <FileText className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 mb-2 max-h-80 w-72 -translate-x-1/2 overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-2xl">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Documents du patient</p>
          {docs === null ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : docs.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Aucun document partagé.</p>
          ) : (
            docs.map((doc) => {
              const presentable = PRESENTABLE.includes(doc.mimeType) && doc.fileSize <= MAX_PRESENT_BYTES;
              const reason = !PRESENTABLE.includes(doc.mimeType)
                ? 'non prévisualisable'
                : doc.fileSize > MAX_PRESENT_BYTES
                ? 'trop volumineux'
                : null;
              return (
                <button
                  key={doc.id}
                  disabled={!presentable || loadingId !== null}
                  onClick={() => handlePick(doc)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingId === doc.id ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span className="flex-1 truncate text-foreground">{doc.fileName}</span>
                  {reason && <span className="shrink-0 text-xs text-muted-foreground">{reason}</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
