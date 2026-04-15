'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { accountingApi } from '@/lib/api/accounting';

function toIso(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function buildYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2];
}

export function ExportSection({ token }: { token: string }) {
  const today = new Date();
  const firstOfYear = new Date(today.getFullYear(), 0, 1);

  const [csvFrom, setCsvFrom] = useState(toIso(firstOfYear));
  const [csvTo, setCsvTo] = useState(toIso(today));
  const [fecYear, setFecYear] = useState(today.getFullYear());
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingFec, setDownloadingFec] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [fecError, setFecError] = useState<string | null>(null);

  const yearOptions = buildYearOptions();

  const handleCsvDownload = async () => {
    setDownloadingCsv(true);
    setCsvError(null);
    try {
      const blob = await accountingApi.exportCsv(token, csvFrom, csvTo);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comptabilite_${csvFrom}_${csvTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setCsvError(e instanceof Error ? e.message : 'Erreur lors de l\'export CSV');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleFecDownload = async () => {
    setDownloadingFec(true);
    setFecError(null);
    try {
      const blob = await accountingApi.exportFec(token, fecYear);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FEC_${fecYear}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setFecError(e instanceof Error ? e.message : 'Erreur lors de l\'export FEC');
    } finally {
      setDownloadingFec(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Exports</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Téléchargez vos données comptables dans différents formats
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CSV Export */}
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <FileSpreadsheet size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Export CSV</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toutes les écritures au format tableur (Excel, LibreOffice)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Du</label>
                <Input
                  type="date"
                  value={csvFrom}
                  onChange={(e) => setCsvFrom(e.target.value)}
                  className="text-sm h-8"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Au</label>
                <Input
                  type="date"
                  value={csvTo}
                  onChange={(e) => setCsvTo(e.target.value)}
                  className="text-sm h-8"
                />
              </div>
            </div>
          </div>

          {csvError && (
            <p className="text-xs text-destructive">{csvError}</p>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleCsvDownload}
            disabled={downloadingCsv || !csvFrom || !csvTo}
            className="w-full"
          >
            <Download size={14} className="mr-1.5" />
            {downloadingCsv ? 'Téléchargement…' : 'Télécharger CSV'}
          </Button>
        </div>

        {/* FEC Export */}
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0">
              <FileText size={16} className="text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Export FEC</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fichier des Écritures Comptables (norme DGFiP)
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Exercice fiscal</label>
            <select
              value={fecYear}
              onChange={(e) => setFecYear(Number(e.target.value))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {fecError && (
            <p className="text-xs text-destructive">{fecError}</p>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleFecDownload}
            disabled={downloadingFec}
            className="w-full"
          >
            <Download size={14} className="mr-1.5" />
            {downloadingFec ? 'Téléchargement…' : 'Télécharger FEC'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Le FEC est requis par l&apos;administration fiscale en cas de contrôle.
          </p>
        </div>
      </div>
    </div>
  );
}
