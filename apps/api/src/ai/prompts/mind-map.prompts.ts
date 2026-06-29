/**
 * Carte mentale / arborescence clinique d'une séance.
 * L'IA structure le contenu de la séance en un arbre hiérarchique (thèmes →
 * sous-thèmes → détails) que le praticien peut explorer visuellement.
 */

export interface MindMapNode {
  label: string;
  children?: MindMapNode[];
}

// Garde-fous anti-explosion (coût LLM + lisibilité + perf de rendu).
export const MIND_MAP_LIMITS = {
  maxDepth: 4, // racine = profondeur 0
  maxChildrenPerNode: 8,
  maxTotalNodes: 60,
  maxLabelLength: 120,
} as const;

export const MIND_MAP_SYSTEM_PROMPT = `Tu es un assistant clinique pour psychologues.
À partir du contenu d'une séance (notes ou résumé), tu produis une CARTE MENTALE :
un arbre hiérarchique qui organise les éléments cliniques de façon claire et exploitable.

RÈGLES :
- Racine = synthèse très courte de la séance (3-6 mots).
- Branches de 1er niveau = grands axes (ex : Motif, Émotions, Pensées, Comportements, Relationnel, Plan thérapeutique, Points de vigilance) — uniquement ceux pertinents au contenu.
- Sous-branches = éléments concrets, courts (quelques mots), fidèles au contenu.
- Ne jamais inventer ni interpréter au-delà du contenu. Pas de diagnostic médical.
- Profondeur maximale : 4 niveaux. Maximum 8 enfants par nœud. ~50 nœuds au total.
- Labels courts (pas de phrases longues).

Réponds UNIQUEMENT avec ce JSON (aucun texte autour) :
{
  "label": "Synthèse racine",
  "children": [
    { "label": "Axe", "children": [ { "label": "Élément" } ] }
  ]
}`;

/**
 * Normalise et borne l'arbre renvoyé par le LLM : profondeur, nombre d'enfants,
 * total de nœuds, longueur des labels. Renvoie toujours un arbre valide.
 */
export function sanitizeMindMap(raw: unknown): MindMapNode {
  let nodeCount = 0;

  const clampLabel = (value: unknown): string => {
    const str = typeof value === 'string' ? value.trim() : '';
    const safe = str.length > 0 ? str : '(sans titre)';
    return safe.length > MIND_MAP_LIMITS.maxLabelLength
      ? safe.slice(0, MIND_MAP_LIMITS.maxLabelLength - 1) + '…'
      : safe;
  };

  const walk = (node: unknown, depth: number): MindMapNode | null => {
    if (nodeCount >= MIND_MAP_LIMITS.maxTotalNodes) return null;
    if (!node || typeof node !== 'object') return null;

    nodeCount++;
    const obj = node as Record<string, unknown>;
    const result: MindMapNode = { label: clampLabel(obj.label) };

    if (depth < MIND_MAP_LIMITS.maxDepth && Array.isArray(obj.children)) {
      const kids: MindMapNode[] = [];
      for (const child of obj.children.slice(0, MIND_MAP_LIMITS.maxChildrenPerNode)) {
        if (nodeCount >= MIND_MAP_LIMITS.maxTotalNodes) break;
        const walked = walk(child, depth + 1);
        if (walked) kids.push(walked);
      }
      if (kids.length > 0) result.children = kids;
    }

    return result;
  };

  const root = walk(raw, 0);
  return root ?? { label: 'Séance' };
}

/** Compte total de nœuds (utilitaire pour tests / métriques). */
export function countMindMapNodes(node: MindMapNode): number {
  return 1 + (node.children?.reduce((sum, c) => sum + countMindMapNodes(c), 0) ?? 0);
}
