// Looks up each title on TMDB and records its poster path in src/data/posters.json.
// Needs a TMDB "API Read Access Token": TMDB_TOKEN=... npm run posters
// Only poster paths are stored; the images themselves stay on TMDB's servers.
import { writeFileSync } from 'node:fs';
import { dataDir, readJson, readTitles } from './lib.mjs';

const token = process.env.TMDB_TOKEN ?? 'provided-by-proxy';
const posters = readJson('posters.json');
const refresh = process.argv.includes('--refresh');
const missing = [];

async function search(kind, query, year) {
  const url = new URL(`https://api.themoviedb.org/3/search/${kind}`);
  url.searchParams.set('query', query);
  if (year) url.searchParams.set(kind === 'movie' ? 'primary_release_year' : 'first_air_date_year', year);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`TMDB answered ${res.status} for "${query}"`);
  return (await res.json()).results ?? [];
}

for (const t of readTitles()) {
  if (posters[t.id] && !refresh) continue;
  const query = t.tmdbQuery ?? t.title;
  const year = t.release.slice(0, 4);
  // Specials are filed as movies on TMDB; try the likelier kind first, then the other.
  const kinds = t.type === 'series' ? ['tv', 'movie'] : ['movie', 'tv'];
  let hit;
  for (const kind of kinds) {
    hit = (await search(kind, query, year)).find((r) => r.poster_path)
      ?? (await search(kind, query)).find((r) => r.poster_path);
    if (hit) break;
  }
  if (hit) {
    posters[t.id] = hit.poster_path;
    console.log(`✓ ${t.title} → ${hit.title ?? hit.name} (${(hit.release_date ?? hit.first_air_date ?? '').slice(0, 4)})`);
  } else {
    missing.push(t.title);
  }
}

const sorted = Object.fromEntries(Object.entries(posters).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(dataDir + 'posters.json', JSON.stringify(sorted, null, 2) + '\n');
console.log(`\n${Object.keys(sorted).length} posters saved.` + (missing.length ? ` Not found: ${missing.join(', ')}` : ''));
