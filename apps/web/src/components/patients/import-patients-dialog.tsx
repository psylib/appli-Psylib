'use client';

import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api/client';
import { patientsApi, type ImportPatientsReport } from '@/lib/api/patients';
import { parseImportFile, type ParsedFile } from '@/lib/import/parse-file';
import {
  autoMapColumns,
  buildMappedRows,
  isMappingValid,
  resolveName,
  TARGET_LABELS,
  TARGET_ORDER,
  type ColumnMapping,
  type ImportTargetField,
} from '@/lib/import/auto-map';

interface ImportPatientsDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Step = 'upload' | 'map' | 'result';

const ACCEPT = '.csv,.xlsx,.xls';

export function ImportPatientsDialog({ open, onClose, onImported }: ImportPatientsDialogProps) {
  const { data: session } = useSession();
  const { success, error: showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportPatientsReport | null>(null);

  const reset = () => {
    setStep('upload');
    setFileName('');
    setParsing(false);
    setParsed(null);
    setMapping(null);
    setDragOver(false);
    setError(null);
    setLimitError(null);
    setImporting(false);
    setReport(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setError(null);
    setParsing(true);
    setFileName(file.name);
    try {
      const result = await parseImportFile(file);
      if (result.rows.length === 0) {
        setError('Aucune ligne de données détectée dans le fichier.');
        setParsing(false);
        return;
      }
      setParsed(result);
      setMapping(autoMapColumns(result.columns));
      setStep('map');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de lire ce fichier.');
    } finally {
      setParsing(false);
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const updateMapping = (field: ImportTargetField, column: string | null) => {
    setMapping((prev) => (prev ? { ...prev, [field]: column } : prev));
  };

  // Lignes qui seront effectivement importées (celles avec un nom résolu)
  const mappedRows = parsed && mapping ? buildMappedRows(parsed.rows, mapping) : [];
  const previewRows = parsed && mapping ? parsed.rows.slice(0, 5) : [];
  const canImport = !!mapping && isMappingValid(mapping) && mappedRows.length > 0;

  const handleImport = async () => {
    if (!canImport) return;
    setImporting(true);
    setError(null);
    setLimitError(null);
    try {
      const token = session?.accessToken ?? '';
      const result = await patientsApi.import(mappedRows, token);
      setReport(result);
      setStep('result');
      if (result.imported > 0) {
        success(`${result.imported} patient${result.imported > 1 ? 's' : ''} importé${result.imported > 1 ? 's' : ''}`);
        onImported();
      }
    } catch (e) {
      if (e instanceof ApiError && (e.details as { code?: string })?.code === 'PATIENT_LIMIT') {
        setLimitError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "L'import a échoué.");
        showError("L'import a échoué");
      }
    } finally {
      setImporting(false);
    }
  };

  const title =
    step === 'upload'
      ? 'Importer des patients'
      : step === 'map'
        ? 'Associer les colonnes'
        : 'Import terminé';

  const description =
    step === 'upload'
      ? 'Migrez votre patientèle depuis un autre logiciel (CSV ou Excel)'
      : step === 'map'
        ? `${fileName} — ${parsed?.rows.length ?? 0} lignes détectées`
        : undefined;

  return (
    <Dialog open={open} onClose={handleClose} title={title} description={description} className="max-w-2xl">
      {/* ─── ÉTAPE 1 : UPLOAD ─────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:bg-border/40'
            }`}
          >
            {parsing ? (
              <>
                <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Lecture de « {fileName} »…</p>
              </>
            ) : (
              <>
                <UploadCloud size={36} className="text-primary" aria-hidden />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Glissez votre fichier ici ou cliquez pour parcourir
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formats acceptés : CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={onFileInput}
            className="hidden"
          />

          {error && (
            <p className="text-sm text-destructive flex items-start gap-2" role="alert">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden />
              {error}
            </p>
          )}

          <div className="rounded-lg bg-surface p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-accent" aria-hidden />
              Vos données restent privées
            </p>
            <p>
              Le fichier est lu directement dans votre navigateur. Seuls les patients que
              vous validez sont envoyés, chiffrés, sur nos serveurs HDS. Les notes sont
              chiffrées (AES-256). Les doublons sont détectés automatiquement.
            </p>
          </div>
        </div>
      )}

      {/* ─── ÉTAPE 2 : MAPPING ────────────────────────────────────────── */}
      {step === 'map' && parsed && mapping && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Vérifiez la correspondance entre vos colonnes et les champs PsyLib.
            Au minimum, un <strong className="text-foreground">nom</strong> est requis
            (ou prénom + nom de famille).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TARGET_ORDER.map((field) => (
              <label key={field} className="flex flex-col gap-1">
                <span className="text-xs font-medium text-foreground">
                  {TARGET_LABELS[field]}
                  {field === 'name' && <span className="text-muted-foreground font-normal"> (ou prénom + nom)</span>}
                </span>
                <select
                  value={mapping[field] ?? ''}
                  onChange={(e) => updateMapping(field, e.target.value || null)}
                  className="h-10 rounded-lg border border-input bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— Ignorer —</option>
                  {parsed.columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {/* Aperçu */}
          <div>
            <p className="text-xs font-medium text-foreground mb-2">Aperçu (5 premières lignes)</p>
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Nom</th>
                    <th className="text-left px-3 py-2 font-medium">Email</th>
                    <th className="text-left px-3 py-2 font-medium">Téléphone</th>
                    <th className="text-left px-3 py-2 font-medium">Naissance</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => {
                    const name = resolveName(row, mapping);
                    return (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 text-foreground">
                          {name || <span className="text-destructive">(vide — ignoré)</span>}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{mapping.email ? row[mapping.email] : '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{mapping.phone ? row[mapping.phone] : '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{mapping.birthDate ? row[mapping.birthDate] : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {!isMappingValid(mapping) && (
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <AlertTriangle size={16} aria-hidden />
              Associez au moins une colonne au nom (ou au prénom / nom de famille).
            </p>
          )}

          {limitError && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
              <p className="flex items-start gap-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden />
                {limitError}
              </p>
              <Link href="/dashboard/settings/billing" className="inline-block font-medium text-primary hover:underline">
                Voir les plans →
              </Link>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive flex items-start gap-2" role="alert">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden />
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => { reset(); }}>
              <ArrowLeft size={16} />
              Changer de fichier
            </Button>
            <Button type="button" onClick={handleImport} loading={importing} disabled={!canImport}>
              Importer {mappedRows.length} patient{mappedRows.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* ─── ÉTAPE 3 : RAPPORT ────────────────────────────────────────── */}
      {step === 'result' && report && (
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center py-2">
            <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mb-3">
              <CheckCircle2 size={30} className="text-accent" aria-hidden />
            </div>
            <p className="text-lg font-semibold text-foreground">
              {report.imported} patient{report.imported > 1 ? 's' : ''} importé{report.imported > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-muted-foreground">
              sur {report.total} ligne{report.total > 1 ? 's' : ''} du fichier
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Importés" value={report.imported} tone="accent" />
            <Stat label="Doublons ignorés" value={report.skippedDuplicates.length} tone="muted" />
            <Stat label="Erreurs" value={report.invalid.length} tone={report.invalid.length ? 'destructive' : 'muted'} />
          </div>

          {report.warnings.length > 0 && (
            <Details
              icon={<AlertTriangle size={14} className="text-amber-600" aria-hidden />}
              title={`${report.warnings.length} avertissement${report.warnings.length > 1 ? 's' : ''}`}
              items={report.warnings.map((w) => `Ligne ${w.row} (${w.name}) : ${w.reason}`)}
            />
          )}
          {report.skippedDuplicates.length > 0 && (
            <Details
              icon={<Copy size={14} className="text-muted-foreground" aria-hidden />}
              title={`${report.skippedDuplicates.length} doublon${report.skippedDuplicates.length > 1 ? 's' : ''} ignoré${report.skippedDuplicates.length > 1 ? 's' : ''}`}
              items={report.skippedDuplicates.map((d) => `Ligne ${d.row} (${d.name}) : ${d.reason}`)}
            />
          )}
          {report.invalid.length > 0 && (
            <Details
              icon={<X size={14} className="text-destructive" aria-hidden />}
              title={`${report.invalid.length} ligne${report.invalid.length > 1 ? 's' : ''} en erreur`}
              items={report.invalid.map((d) => `Ligne ${d.row} : ${d.reason}`)}
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => reset()}>
              Importer un autre fichier
            </Button>
            <Button type="button" onClick={handleClose}>Terminé</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'accent' | 'muted' | 'destructive' }) {
  const color =
    tone === 'accent' ? 'text-accent' : tone === 'destructive' ? 'text-destructive' : 'text-foreground';
  return (
    <div className="rounded-lg border border-border bg-white py-3">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function Details({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <details className="rounded-lg border border-border bg-surface">
      <summary className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground cursor-pointer select-none">
        {icon}
        {title}
      </summary>
      <ul className="px-3 pb-3 pt-1 space-y-1 max-h-48 overflow-y-auto">
        {items.map((it, i) => (
          <li key={i} className="text-xs text-muted-foreground">{it}</li>
        ))}
      </ul>
    </details>
  );
}
