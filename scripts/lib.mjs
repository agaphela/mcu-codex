import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const dataDir = fileURLToPath(new URL('../src/data/', import.meta.url));
export const readJson = (name) => JSON.parse(readFileSync(dataDir + name, 'utf8'));

/** Every title record, tagged with the file it came from. */
export function readTitles() {
  return readdirSync(dataDir + 'titles')
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => readJson(`titles/${f}`).map((t) => ({ ...t, file: f })));
}
