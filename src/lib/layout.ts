import type { Order, Tier, TierFilter } from './types';

/**
 * Layout engine: turns titles into grid positions.
 *
 * The grid has one row per lane (universe) and one column per story beat.
 * It is pure and shared by the build (first render) and the browser
 * (re-layout when the reader changes order or filter).
 */

export interface LayoutInput {
  id: string;
  lane: string;
  beat: number;
  release: string;
  tier: Tier;
  crossovers?: string[];
}

export interface Layout {
  /** Number of columns in use. */
  cols: number;
  /** Visible titles: 1-based column, 1-based lane row, and slot within the column. */
  nodes: Record<string, { col: number; row: number; slot: number }>;
  /** First and last column used by each lane; absent when the lane is empty. */
  spans: Record<string, [number, number]>;
  /** Cross-lane links: a line at one column between two rows. */
  connectors: { id: string; col: number; r0: number; r1: number }[];
  /** Visible title ids in reading order. */
  sequence: string[];
}

const RANK: Record<Tier, number> = { essential: 0, recommended: 1, optional: 2 };
const MAX_RANK: Record<TierFilter, number> = { essential: 0, recommended: 1, all: 2 };

export function isVisible(tier: Tier, filter: TierFilter): boolean {
  return RANK[tier] <= MAX_RANK[filter];
}

export function computeLayout(
  titles: LayoutInput[],
  laneIds: string[],
  opts: { order: Order; tier: TierFilter },
): Layout {
  const rowOf = new Map(laneIds.map((id, i) => [id, i + 1]));
  const key = (t: LayoutInput) => (opts.order === 'story' ? t.beat : Date.parse(t.release));

  const visible = titles
    .filter((t) => isVisible(t.tier, opts.tier))
    .sort((a, b) => key(a) - key(b) || rowOf.get(a.lane)! - rowOf.get(b.lane)!);

  const layout: Layout = { cols: 0, nodes: {}, spans: {}, connectors: [], sequence: [] };
  let lastKey: number | null = null;
  let slot = 0;

  for (const t of visible) {
    // In story order, equal beats share a column (simultaneous events).
    // In release order every title gets its own column.
    const shares = opts.order === 'story' && lastKey !== null && key(t) === lastKey;
    if (shares) slot += 1;
    else {
      layout.cols += 1;
      slot = 0;
    }
    lastKey = key(t);

    const col = layout.cols;
    const row = rowOf.get(t.lane)!;
    layout.nodes[t.id] = { col, row, slot };
    layout.sequence.push(t.id);

    const span = layout.spans[t.lane];
    if (span) span[1] = col;
    else layout.spans[t.lane] = [col, col];

  }

  // Crossovers: link a title to the other lanes it reaches, at its own column.
  // Lanes with nothing visible are skipped so a link never ends in empty space.
  const populated = new Set(visible.map((t) => t.lane));
  for (const t of visible) {
    const { col, row } = layout.nodes[t.id];
    const lanes = (t.crossovers ?? []).filter((l) => populated.has(l));
    if (!lanes.length) continue;
    const rows = [row, ...lanes.map((l) => rowOf.get(l)!)];
    layout.connectors.push({ id: t.id, col, r0: Math.min(...rows), r1: Math.max(...rows) });
    // Stretch the other lane's line so the link touches it.
    for (const lane of lanes) {
      const span = layout.spans[lane];
      span[0] = Math.min(span[0], col);
      span[1] = Math.max(span[1], col);
    }
  }

  return layout;
}
