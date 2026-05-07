'use client';

import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

const CATEGORIES = [
  { value: 'exercise', label: 'Exercice thérapeutique' },
  { value: 'administrative', label: 'Administratif' },
  { value: 'session_report', label: 'Compte-rendu de séance' },
  { value: 'other', label: 'Autre' },
] as const;

type Category = (typeof CATEGORIES)[number]['value'];

interface ShareDocumentDialogProps {
  patientId: string;
  patientName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShareDocumentDialog({
  patientId,
  patientName,
  open,
  onClose,
  onSuccess,
}: ShareDocumentDialogProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<Category>('other');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.docx,.odt';

  const handleFile = (f: File) => {
    setFile(f);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setFile(null);
    setCategory('other');
    setMessage('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }
    const token = session?.accessToken;
    if (!token) {
      setError('Session expirée, veuillez vous reconnecter');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      formData.append('category', category);
      if (message.trim()) formData.append('message', message.trim());

      const res = await fetch(`${API}/api/v1/documents/share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        let msg = 'Erreur lors du partage du document';
        try {
          const body = await res.json() as { message?: string };
          if (body.message) msg = body.message;
        } catch {
          // ignore
        }
        setError(msg);
        return;
      }

      reset();
      onSuccess();
      onClose();
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-in panel from right */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-doc-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 id="share-doc-title" className="text-base font-semibold text-foreground">
              Partager un document
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vers {patientName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 px-6 py-5">
            {/* Drop zone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Fichier <span className="text-destructive">*</span>
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                  dragging
                    ? 'border-primary bg-primary/5'
                    : file
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-surface hover:border-primary/60 hover:bg-primary/5'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload
                  size={28}
                  className={file ? 'text-accent' : 'text-muted-foreground'}
                />
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[280px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-foreground">
                      Glissez-déposez ou{' '}
                      <span className="text-primary font-medium">parcourez</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG, DOCX, ODT — max 10 Mo
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                className="sr-only"
                onChange={handleInputChange}
                tabIndex={-1}
              />
              {file && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="mt-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Supprimer le fichier
                </button>
              )}
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="share-doc-category"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Catégorie
              </label>
              <select
                id="share-doc-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="share-doc-message"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Message{' '}
                <span className="text-muted-foreground font-normal">(optionnel)</span>
              </label>
              <textarea
                id="share-doc-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Accompagnez votre document d&#39;une note pour votre patient..."
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {message.length}/2000
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" loading={loading} disabled={!file}>
              <Upload size={14} />
              Partager
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
