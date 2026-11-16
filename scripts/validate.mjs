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
