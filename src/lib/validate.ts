import type { Character, Lane, TitleRecord } from './types';

const TYPES = ['film', 'series', 'special'];
const TIERS = ['essential', 'recommended', 'optional'];

/**
 * Checks every title against the lanes and the character registry.
 * Returns a list of problems; an empty list means the data is consistent.
 */
export function validate(
  titles: TitleRecord[],
  lanes: Lane[],
  characters: Record<string, Character>,
): string[] {
  const errors: string[] = [];
  const laneIds = new Set(lanes.map((l) => l.id));
  const seen = new Set<string>();
  const beatInLane = new Map<string, string>();

  for (const t of titles) {
    const at = `title "${t.id ?? t.title ?? '?'}"`;
    const need = (cond: unknown, msg: string) => {
      if (!cond) errors.push(`${at}: ${msg}`);
    };

    need(typeof t.id === 'string' && /^[a-z0-9-]+$/.test(t.id), 'id must be lowercase letters, digits and dashes');
    need(!seen.has(t.id), 'duplicate id');
    seen.add(t.id);
    need(typeof t.title === 'string' && t.title, 'missing title');
    need(TYPES.includes(t.type), `type must be one of ${TYPES.join(', ')}`);
    need(TIERS.includes(t.tier), `tier must be one of ${TIERS.join(', ')}`);
    need(/^\d{4}-\d{2}-\d{2}$/.test(t.release) && !Number.isNaN(Date.parse(t.release)), 'release must be YYYY-MM-DD');
    need(laneIds.has(t.lane), `unknown lane "${t.lane}"`);
    need(typeof t.beat === 'number' && Number.isFinite(t.beat), 'beat must be a number');
    need(typeof t.year === 'string' && t.year, 'missing year label');
    need(typeof t.short === 'string' && t.short, 'missing short plot');
    need(Array.isArray(t.plot) && t.plot.length > 0, 'missing plot');
    need(Array.isArray(t.main) && Array.isArray(t.supporting), 'main and supporting must be lists');

    const slotKey = `${t.lane}@${t.beat}`;
    need(!beatInLane.has(slotKey), `shares lane and beat with "${beatInLane.get(slotKey)}"`);
    beatInLane.set(slotKey, t.id);

    for (const lane of t.crossovers ?? []) {
      need(laneIds.has(lane), `unknown crossover lane "${lane}"`);
      need(lane !== t.lane, 'crossover lane is the title\'s own lane');
    }

    const cast = [...(t.main ?? []), ...(t.supporting ?? [])];
    need(new Set(cast).size === cast.length, 'a character is listed twice');
    for (const c of cast) need(characters[c], `unknown character "${c}" (run npm run characters:sync)`);
  }

  return errors;
}
