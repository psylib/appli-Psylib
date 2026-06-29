'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MindMapNode } from '@/lib/api/ai';

// Dimensions de la mise en page (arbre horizontal : racine à gauche).
const COL_W = 230; // espacement horizontal entre niveaux (> largeur max d'un nœud → pas de chevauchement)
const ROW_H = 46; // hauteur d'une « ligne » (feuille)
const NODE_H = 32;
const NODE_MAX_W = 190;
const PAD = 16;

// Couleurs par profondeur (palette PsyLib, contrastes AA, texte blanc).
const DEPTH_COLORS = ['#3D52A0', '#0D9488', '#7C3AED', '#475569'];

interface PositionedNode {
  id: string;
  label: string;
  depth: number;
  x: number;
  y: number; // coin haut-gauche
  w: number;
  hasChildren: boolean;
  collapsed: boolean;
}

interface Edge {
  from: string;
  to: string;
}

function clampWidth(label: string): number {
  return Math.min(NODE_MAX_W, Math.max(70, label.length * 7 + 24));
}

function depthColor(depth: number): string {
  return DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)] ?? '#475569';
}

interface Layout {
  nodes: PositionedNode[];
  edges: Edge[];
  width: number;
  height: number;
}

function computeLayout(root: MindMapNode, collapsed: Set<string>): Layout {
  const nodes: PositionedNode[] = [];
  let slot = 0;

  // Renvoie le centre vertical (px) du nœud, pour positionner le parent.
  const walk = (node: MindMapNode, depth: number, id: string): number => {
    const isCollapsed = collapsed.has(id);
    const children = !isCollapsed && node.children ? node.children : [];
    const w = clampWidth(node.label || '');
    const x = depth * COL_W + PAD;

    let centerY: number;
    if (children.length === 0) {
      centerY = slot * ROW_H + ROW_H / 2 + PAD;
      slot += 1;
    } else {
      const centers = children.map((c, i) => walk(c, depth + 1, `${id}.${i}`));
      centerY = ((centers[0] ?? 0) + (centers[centers.length - 1] ?? 0)) / 2;
    }

    nodes.push({
      id,
      label: node.label || '(sans titre)',
      depth,
      x,
      y: centerY - NODE_H / 2,
      w,
      hasChildren: !!(node.children && node.children.length > 0),
      collapsed: isCollapsed,
    });
    return centerY;
  };

  walk(root, 0, '0');

  // Arêtes : chaque nœud visible (sauf racine) relié à son parent visible.
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: Edge[] = [];
  for (const n of nodes) {
    if (n.id === '0') continue;
    const parentId = n.id.slice(0, n.id.lastIndexOf('.'));
    if (byId.has(parentId)) edges.push({ from: parentId, to: n.id });
  }

  const width = Math.max(...nodes.map((n) => n.x + n.w), 0) + PAD;
  const height = slot * ROW_H + PAD * 2;
  return { nodes, edges, width, height };
}

export function MindMapView({ data }: { data: MindMapNode }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);

  const layout = useMemo(() => computeLayout(data, collapsed), [data, collapsed]);
  const byId = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const downloadSvg = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const blob = new Blob([clone.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carte-mentale-seance.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={downloadSvg}>
          <Download size={14} />
          Télécharger (SVG)
        </Button>
      </div>

      <div className="overflow-auto rounded-lg border border-border bg-white" style={{ maxHeight: 560 }}>
        <svg
          ref={svgRef}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label="Carte mentale de la séance"
          style={{ display: 'block', minWidth: '100%' }}
        >
          {/* Arêtes */}
          {layout.edges.map((e) => {
            const p = byId.get(e.from);
            const c = byId.get(e.to);
            if (!p || !c) return null;
            const x1 = p.x + p.w;
            const y1 = p.y + NODE_H / 2;
            const x2 = c.x;
            const y2 = c.y + NODE_H / 2;
            const dx = Math.max(20, (x2 - x1) / 2);
            return (
              <path
                key={`${e.from}->${e.to}`}
                d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#CBD5E1"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Nœuds */}
          {layout.nodes.map((n) => {
            const color = depthColor(n.depth);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                onClick={() => n.hasChildren && toggle(n.id)}
                style={{ cursor: n.hasChildren ? 'pointer' : 'default' }}
              >
                <rect
                  width={n.w}
                  height={NODE_H}
                  rx={8}
                  ry={8}
                  fill={color}
                  opacity={n.depth >= 3 ? 0.85 : 1}
                />
                <text
                  x={10}
                  y={NODE_H / 2}
                  dominantBaseline="central"
                  fontSize={12}
                  fill="#ffffff"
                  fontFamily="Inter, sans-serif"
                >
                  {n.label.length > Math.floor((n.w - 28) / 7)
                    ? n.label.slice(0, Math.floor((n.w - 28) / 7)) + '…'
                    : n.label}
                  <title>{n.label}</title>
                </text>
                {/* Indicateur pliage si enfants masqués */}
                {n.hasChildren && n.collapsed && (
                  <circle cx={n.w - 9} cy={NODE_H / 2} r={7} fill="#ffffff" opacity={0.9}>
                    <title>Déplier</title>
                  </circle>
                )}
                {n.hasChildren && n.collapsed && (
                  <text
                    x={n.w - 9}
                    y={NODE_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    fontWeight="bold"
                    fill={color}
                  >
                    +
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-xs text-muted-foreground/70">
        Cliquez sur un nœud pour replier/déplier ses branches. ⚠ Synthèse générée par IA — à réviser par le praticien.
      </p>
    </div>
  );
}
