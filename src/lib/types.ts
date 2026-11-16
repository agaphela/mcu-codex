export type Tier = 'essential' | 'recommended' | 'optional';
export type TitleType = 'film' | 'series' | 'special';
export type Order = 'story' | 'release';
export type TierFilter = 'all' | 'recommended' | 'essential';

export interface Lane {
  id: string;
  /** Short code shown on narrow screens. */
  code: string;
  name: string;
  color: string;
  note: string;
}

/** A title as authored in src/data/titles/*.json. */
export interface TitleRecord {
  id: string;
  title: string;
  type: TitleType;
  /** ISO date of first release. */
  release: string;
  lane: string;
  /**
   * Story position shared by every lane. Two titles with the same beat happen
   * "at the same time". It is an ordering key, not a calendar year.
   */
  beat: number;
  /** In-universe date label on this lane's own clock, e.g. "2012" or "1960s". */
  year: string;
  saga?: 'Infinity' | 'Multiverse';
  phase?: number;
  /** How much the title matters for following the story into Avengers: Doomsday. */
  tier: Tier;
  short: string;
  plot: string[];
  main: string[];
  supporting: string[];
  /** Other lanes this story reaches into. Drawn as a connector at the same beat. */
  crossovers?: string[];
  /** Summary written from limited sources; shown with a caveat. */
  provisional?: boolean;
  /** Not released yet. Excluded from character debut calculation. */
  upcoming?: boolean;
  /** Overrides the TMDB search used by scripts/fetch-posters.mjs. */
  tmdbQuery?: string;
  /** Exact streaming URLs keyed by service, e.g. { "disney": "https://…" }. */
  watch?: Record<string, string>;
}

export interface Character {
  name: string;
  alias?: string;
}

/** A title enriched with derived data, ready for the page. */
export interface Title extends TitleRecord {
  /** Characters whose earliest released appearance is this title. */
  debuts: string[];
}

export interface CodexData {
  lanes: Lane[];
  titles: Title[];
  characters: Record<string, Character>;
  posters: Record<string, string>;
}
