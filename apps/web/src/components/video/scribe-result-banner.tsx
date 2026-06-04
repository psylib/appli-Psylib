import { Sparkles } from 'lucide-react';

interface ScribeResultBannerProps {
  summaryAi: string | null;
}

export function ScribeResultBanner({ summaryAi }: ScribeResultBannerProps) {
  if (!summaryAi) return null;

  return (
    <div className="rounded-xl border border-[#0D9488]/30 bg-[#0D9488]/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#0D9488]" />
        <span className="text-sm font-medium text-[#0D9488]">Note générée par le Scribe IA</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{summaryAi}</p>
      <p className="mt-3 text-xs text-muted-foreground/70">
        ⚠ À réviser et valider par le praticien avant tout usage clinique.
      </p>
    </div>
  );
}
