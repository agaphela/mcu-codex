// Checks the data files without building the site: npm run validate
import { validate } from '../src/lib/validate.ts';
import { readJson, readTitles } from './lib.mjs';

const titles = readTitles();
const errors = validate(titles, readJson('universes.json'), readJson('characters.json'));
if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join('\n'));
  process.exit(1);
}
console.log(`OK: ${titles.length} titles are consistent.`);

// TMDB's API terms allow keeping their data for at most 6 months.
const { fetchedAt } = readJson('posters.json');
const ageDays = Math.floor((Date.now() - Date.parse(fetchedAt)) / 86_400_000);
if (ageDays > 180) {
  console.error(`Poster data is ${ageDays} days old (TMDB limit: 6 months). Run: npm run posters`);
  process.exit(1);
}
if (ageDays > 150) console.warn(`Poster data is ${ageDays} days old. Refresh soon: npm run posters`);
