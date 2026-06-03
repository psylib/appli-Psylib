/**
 * Champs cibles PsyLib pour l'import patients.
 * `firstName` + `lastName` sont fusionnés en `name` si `name` n'est pas mappé
 * (beaucoup d'exports séparent prénom et nom).
 */
export type ImportTargetField =
  | 'name'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'birthDate'
  | 'notes'
  | 'source';

export type ColumnMapping = Record<ImportTargetField, string | null>;

export const TARGET_LABELS: Record<ImportTargetField, string> = {
  name: 'Nom complet',
  firstName: 'Prénom',
  lastName: 'Nom de famille',
  email: 'Email',
  phone: 'Téléphone',
  birthDate: 'Date de naissance',
  notes: 'Notes',
  source: 'Source / Origine',
};

/** Ordre d'affichage dans l'UI de mapping */
export const TARGET_ORDER: ImportTargetField[] = [
  'name',
  'firstName',
  'lastName',
  'email',
  'phone',
  'birthDate',
  'notes',
  'source',
];

const SYNONYMS: Record<ImportTargetField, string[]> = {
  name: ['nom complet', 'nom et prenom', 'nom prenom', 'prenom nom', 'name', 'full name', 'patient', 'nom du patient', 'identite'],
  firstName: ['prenom', 'first name', 'firstname', 'first', 'given name'],
  lastName: ['nom', 'nom de famille', 'last name', 'lastname', 'last', 'surname', 'family name'],
  email: ['email', 'e mail', 'mail', 'courriel', 'adresse email', 'adresse mail', 'e-mail'],
  phone: ['telephone', 'tel', 'phone', 'portable', 'mobile', 'gsm', 'numero', 'numero de telephone', 'tel portable', 'tel mobile'],
  birthDate: ['date de naissance', 'naissance', 'birthdate', 'birth date', 'date naissance', 'ne le', 'nee le', 'dob', 'ddn', 'date de naiss'],
  notes: ['notes', 'note', 'commentaire', 'commentaires', 'remarque', 'remarques', 'observations', 'observation', 'memo'],
  source: ['source', 'origine', 'provenance', 'canal'],
};

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[._\-/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Devine automatiquement la correspondance colonnes → champs PsyLib.
 * Heuristique : correspondance exacte d'abord, puis inclusion.
 */
export function autoMapColumns(columns: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    name: null,
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    birthDate: null,
    notes: null,
    source: null,
  };

  const normCols = columns.map((c) => ({ raw: c, norm: normalize(c) }));
  const used = new Set<string>();

  // 1er passage : correspondance exacte
  for (const field of TARGET_ORDER) {
    const syns = SYNONYMS[field];
    const hit = normCols.find((c) => !used.has(c.raw) && syns.includes(c.norm));
    if (hit) {
      mapping[field] = hit.raw;
      used.add(hit.raw);
    }
  }

  // 2e passage : inclusion (la colonne contient un synonyme)
  for (const field of TARGET_ORDER) {
    if (mapping[field]) continue;
    const syns = SYNONYMS[field];
    const hit = normCols.find(
      (c) => !used.has(c.raw) && syns.some((s) => c.norm.includes(s)),
    );
    if (hit) {
      mapping[field] = hit.raw;
      used.add(hit.raw);
    }
  }

  return mapping;
}

/** Construit la valeur "nom" finale à partir du mapping (name OU prénom+nom). */
export function resolveName(row: Record<string, string>, mapping: ColumnMapping): string {
  if (mapping.name && row[mapping.name]?.trim()) {
    return row[mapping.name]!.trim();
  }
  const first = mapping.firstName ? (row[mapping.firstName] ?? '').trim() : '';
  const last = mapping.lastName ? (row[mapping.lastName] ?? '').trim() : '';
  return `${first} ${last}`.trim();
}

export interface MappedRow {
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
  source?: string;
}

/** Transforme les lignes brutes en lignes mappées, en filtrant celles sans nom. */
export function buildMappedRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
): MappedRow[] {
  const out: MappedRow[] = [];
  for (const row of rows) {
    const name = resolveName(row, mapping);
    if (!name) continue; // ligne sans nom = ignorée
    const get = (f: ImportTargetField) => (mapping[f] ? (row[mapping[f]!] ?? '').trim() : '');
    const entry: MappedRow = { name };
    const email = get('email');
    const phone = get('phone');
    const birthDate = get('birthDate');
    const notes = get('notes');
    const source = get('source');
    if (email) entry.email = email;
    if (phone) entry.phone = phone;
    if (birthDate) entry.birthDate = birthDate;
    if (notes) entry.notes = notes;
    if (source) entry.source = source;
    out.push(entry);
  }
  return out;
}

/** Le mapping est valide si on peut produire un nom (name OU lastName/firstName). */
export function isMappingValid(mapping: ColumnMapping): boolean {
  return Boolean(mapping.name || mapping.lastName || mapping.firstName);
}
