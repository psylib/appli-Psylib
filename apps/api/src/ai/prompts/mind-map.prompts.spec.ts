import { describe, it, expect } from 'vitest';
import {
  sanitizeMindMap,
  countMindMapNodes,
  MIND_MAP_LIMITS,
  type MindMapNode,
} from './mind-map.prompts';

describe('sanitizeMindMap', () => {
  it('conserve un arbre valide simple', () => {
    const raw = { label: 'Séance', children: [{ label: 'Anxiété' }, { label: 'Sommeil' }] };
    const out = sanitizeMindMap(raw);
    expect(out.label).toBe('Séance');
    expect(out.children).toHaveLength(2);
  });

  it('borne la profondeur à maxDepth', () => {
    // Construit un arbre de profondeur 8
    let node: MindMapNode = { label: 'feuille' };
    for (let i = 0; i < 8; i++) node = { label: `n${i}`, children: [node] };
    const out = sanitizeMindMap(node);

    let depth = 0;
    let cur: MindMapNode | undefined = out;
    while (cur?.children?.length) { depth++; cur = cur.children[0]; }
    expect(depth).toBeLessThanOrEqual(MIND_MAP_LIMITS.maxDepth);
  });

  it('borne le nombre d’enfants par nœud', () => {
    const children = Array.from({ length: 30 }, (_, i) => ({ label: `c${i}` }));
    const out = sanitizeMindMap({ label: 'root', children });
    expect(out.children!.length).toBeLessThanOrEqual(MIND_MAP_LIMITS.maxChildrenPerNode);
  });

  it('borne le total de nœuds', () => {
    // Arbre large : racine + 8 enfants × 8 petits-enfants × 8 = explose au-delà de 60
    const deep = Array.from({ length: 8 }, (_, i) => ({
      label: `a${i}`,
      children: Array.from({ length: 8 }, (_, j) => ({
        label: `b${j}`,
        children: Array.from({ length: 8 }, (_, k) => ({ label: `c${k}` })),
      })),
    }));
    const out = sanitizeMindMap({ label: 'root', children: deep });
    expect(countMindMapNodes(out)).toBeLessThanOrEqual(MIND_MAP_LIMITS.maxTotalNodes);
  });

  it('tronque les labels trop longs', () => {
    const longLabel = 'x'.repeat(500);
    const out = sanitizeMindMap({ label: longLabel });
    expect(out.label.length).toBeLessThanOrEqual(MIND_MAP_LIMITS.maxLabelLength);
  });

  it('renvoie un arbre par défaut pour une entrée invalide', () => {
    expect(sanitizeMindMap(null).label).toBeTruthy();
    expect(sanitizeMindMap('pas un objet').label).toBeTruthy();
    expect(sanitizeMindMap(42).label).toBeTruthy();
  });

  it('remplace un label vide par un placeholder', () => {
    const out = sanitizeMindMap({ label: '   ', children: [{ label: '' }] });
    expect(out.label).toBe('(sans titre)');
    expect(out.children![0].label).toBe('(sans titre)');
  });
});
