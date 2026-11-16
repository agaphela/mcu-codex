// Adds any character id used by a title but missing from characters.json,
// with a name guessed from the id. Review the new entries afterwards.
import { writeFileSync } from 'node:fs';
import { dataDir, readJson, readTitles } from './lib.mjs';

// Suffixes that mark which universe's version of a character this is.
const VARIANT = /-(raimi|webb|legacy|fox|616|838|97|ssu|origins|zombies|yfnsm|spider-verse|wolverine)$/;

const guessName = (id) =>
  id
    .replace(VARIANT, '')
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');

const characters = readJson('characters.json');
const added = [];
for (const t of readTitles()) {
  for (const id of [...t.main, ...t.supporting]) {
    if (!characters[id]) {
      characters[id] = { name: guessName(id) };
      added.push(id);
    }
  }
}

const sorted = Object.fromEntries(Object.entries(characters).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(dataDir + 'characters.json', JSON.stringify(sorted, null, 2) + '\n');
console.log(added.length ? `Added ${added.length}: ${added.join(', ')}` : 'Nothing to add.');
