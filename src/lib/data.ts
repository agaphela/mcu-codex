import lanesJson from '../data/universes.json';
import charactersJson from '../data/characters.json';
import postersJson from '../data/posters.json';
import type { Character, CodexData, Lane, Title, TitleRecord } from './types';
import { validate } from './validate';

const files = import.meta.glob<{ default: TitleRecord[] }>('../data/titles/*.json', { eager: true });

/** For every character, the id of the released title they first appeared in. */
export function deriveDebuts(titles: TitleRecord[]): Map<string, string> {
  const debut = new Map<string, string>();
  const byRelease = titles
    .filter((t) => !t.upcoming)
    .sort((a, b) => a.release.localeCompare(b.release));
  for (const t of byRelease) {
    for (const c of [...t.main, ...t.supporting]) if (!debut.has(c)) debut.set(c, t.id);
  }
  return debut;
}

export function loadCodex(): CodexData {
  const lanes = lanesJson as Lane[];
  const characters = charactersJson as Record<string, Character>;
  const records = Object.values(files).flatMap((m) => m.default);

  const errors = validate(records, lanes, characters);
  if (errors.length) throw new Error(`Codex data is invalid:\n- ${errors.join('\n- ')}`);

  const debut = deriveDebuts(records);
  const titles: Title[] = records
    .map((t) => ({
      ...t,
      debuts: [...t.main, ...t.supporting].filter((c) => debut.get(c) === t.id),
    }))
    .sort((a, b) => a.beat - b.beat);

  // Only ship the characters that are actually referenced.
  const used = new Set(titles.flatMap((t) => [...t.main, ...t.supporting]));
  const usedCharacters = Object.fromEntries(Object.entries(characters).filter(([id]) => used.has(id)));

  return { lanes, titles, characters: usedCharacters, posters: (postersJson as { paths: Record<string, string> }).paths };
}
