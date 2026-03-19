'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { downloadFile } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface ExportButtonProps {
  path: string;
  filename: string;
  label?: string;
  variant?: 'default' | 'ghost';
  className?: string;
}

export function ExportButton({
  path,
  filename,
  label = 'Exporter',
  variant = 'default',
  className,
}: ExportButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      await downloadFile(path, filename, session.accessToken);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={() => void handleClick()}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          variant === 'default'
            ? 'border border-border hover:border-primary/30 hover:bg-surface text-foreground'
            : 'text-muted-foreground hover:text-foreground',
          loading && 'opacity-60 cursor-not-allowed',
          className,
        )}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" aria-hidden />
        ) : (
          <Download size={14} aria-hidden />
        )}
        {loading ? 'Export en cours…' : label}
      </button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
