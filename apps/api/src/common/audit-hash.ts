import { createHash } from 'crypto';

/**
 * Chaînage cryptographique des journaux d'audit (WORM / preuve opposable HDS).
 *
 * Chaque entrée `audit_logs` porte un `hash` = SHA-256 d'une représentation
 * canonique de son contenu immuable + le `hash` de l'entrée précédente
 * (`prevHash`). Conséquences :
 * - modifier le contenu d'une entrée → son `hash` recalculé ne correspond plus ;
 * - supprimer une entrée → le `prevHash` de la suivante ne pointe plus sur rien.
 * La chaîne rend donc toute altération a posteriori détectable.
 *
 * Fonctions pures (pas d'I/O) → testables isolément et réutilisables par le
 * vérificateur d'intégrité.
 */

export interface AuditHashInput {
  actorId: string | null;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string | null;
  metadata: unknown;
  /** Date d'écriture — Date ou ISO string (normalisée en ISO avant hachage). */
  createdAt: Date | string;
  /** Hash de l'entrée précédente, ou null pour la genèse de la chaîne. */
  prevHash: string | null;
}

/**
 * Sérialisation JSON déterministe : clés d'objets triées récursivement, pour
 * que deux objets équivalents (ordre de clés différent) produisent la même
 * chaîne — condition indispensable à un hash stable.
 */
export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

/** Calcule le hash SHA-256 (hex) d'une entrée d'audit, chaînée à `prevHash`. */
export function computeAuditHash(input: AuditHashInput): string {
  const createdAtIso =
    input.createdAt instanceof Date ? input.createdAt.toISOString() : input.createdAt;
  const canonical = canonicalize({
    actorId: input.actorId ?? null,
    actorType: input.actorType,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    ipAddress: input.ipAddress ?? null,
    metadata: input.metadata ?? null,
    createdAt: createdAtIso,
    prevHash: input.prevHash ?? null,
  });
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/** Une entrée de la chaîne telle que relue en base (avec son hash stocké). */
export interface AuditChainRow extends AuditHashInput {
  id: string;
  hash: string;
}

export interface AuditChainVerdict {
  valid: boolean;
  /** Nombre d'entrées vérifiées avant l'éventuelle rupture. */
  checked: number;
  brokenAt?: { id: string; reason: 'hash-mismatch' | 'broken-link' };
}

/**
 * Vérifie l'intégrité d'une chaîne d'audit, à partir des entrées **ordonnées
 * par seq croissant** (ordre d'insertion). Détecte :
 * - `hash-mismatch` : le contenu d'une entrée a été altéré (le hash recalculé
 *   ne correspond plus au hash stocké) ;
 * - `broken-link` : une entrée a été supprimée ou réordonnée (le `prevHash`
 *   d'une entrée ne pointe plus sur le hash de la précédente).
 *
 * Fonction pure → testable sans base de données.
 */
export function verifyAuditChain(rowsOrderedBySeq: AuditChainRow[]): AuditChainVerdict {
  let prev: string | null = null;
  let checked = 0;
  for (const row of rowsOrderedBySeq) {
    if ((row.prevHash ?? null) !== prev) {
      return { valid: false, checked, brokenAt: { id: row.id, reason: 'broken-link' } };
    }
    if (computeAuditHash(row) !== row.hash) {
      return { valid: false, checked, brokenAt: { id: row.id, reason: 'hash-mismatch' } };
    }
    prev = row.hash;
    checked++;
  }
  return { valid: true, checked };
}
