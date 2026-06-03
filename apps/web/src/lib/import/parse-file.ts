import Papa from 'papaparse';

export interface ParsedFile {
  columns: string[];
  rows: Record<string, string>[];
}

const MAX_ROWS = 5000;

/**
 * Parse un fichier d'import (CSV ou Excel) côté navigateur.
 * Les données du psychologue ne quittent jamais son navigateur tant qu'il
 * n'a pas validé l'import — conformité HDS : aucun fichier patient n'est
 * stocké côté serveur, seules les lignes mappées et validées sont envoyées.
 */
export async function parseImportFile(file: File): Promise<ParsedFile> {
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file);
  }
  return parseCsv(file);
}

function parseCsv(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const columns = (result.meta.fields ?? []).filter((c) => c && c.trim().length > 0);
        const rows = (result.data as Record<string, string>[])
          .slice(0, MAX_ROWS)
          .map((r) => normalizeRow(r, columns));
        if (columns.length === 0) {
          reject(new Error('Aucune colonne détectée. Vérifiez que la première ligne contient les en-têtes.'));
          return;
        }
        resolve({ columns, rows });
      },
      error: (err) => reject(new Error(`Lecture CSV impossible : ${err.message}`)),
    });
  });
}

async function parseExcel(file: File): Promise<ParsedFile> {
  // Chargement à la demande — n'alourdit le bundle que si un .xlsx est sélectionné
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('Le fichier Excel ne contient aucune feuille.');
  const sheet = workbook.Sheets[firstSheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet!, {
    defval: '',
    raw: false, // formate dates/nombres en chaînes lisibles
  });

  if (json.length === 0) throw new Error('La feuille Excel est vide.');

  const columns = Object.keys(json[0] as object)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const rows = json.slice(0, MAX_ROWS).map((r) => {
    const out: Record<string, string> = {};
    for (const col of columns) {
      const val = (r as Record<string, unknown>)[col];
      out[col] = val == null ? '' : String(val).trim();
    }
    return out;
  });

  return { columns, rows };
}

function normalizeRow(row: Record<string, string>, columns: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const col of columns) {
    const v = row[col];
    out[col] = v == null ? '' : String(v).trim();
  }
  return out;
}
