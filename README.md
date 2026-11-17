# MCU Codex

An interactive timeline of every Marvel film and series, across every universe, built as a guide to
*Avengers: Doomsday*. Unofficial fan project.

- **Rows are universes** (the Sacred Timeline, the TVA, the Fox X-Men universe, Earth-828 and so on).
- **Columns are story beats.** Titles in the same column happen at the same point in the story, even
  when their universes show different years. Each title carries a year label on its own universe's clock.
- **Hover** a node for the poster and title; **click** for the plot, new characters, cast and a watch link.
  On touch screens the first tap shows the card with a "See details" button.
- **Main story / Recommended / Everything** narrows the timeline to what matters for Doomsday.

## Run it

```sh
npm install
npm run dev        # local preview
npm run validate   # check the data files
npm run build      # static site in dist/
```

Pushing to `main` deploys to GitHub Pages (Settings → Pages → Source: GitHub Actions).

## How it is organised

```
src/data/universes.json     lanes: one per universe
src/data/titles/*.json      films and series, grouped by studio era
src/data/characters.json    character registry (names and aliases)
src/data/posters.json       TMDB poster paths, written by `npm run posters`
src/lib/layout.ts           layout engine: titles → grid positions (shared by build and browser)
src/lib/data.ts             loads, validates and derives data (e.g. each character's debut)
src/lib/validate.ts         data rules; the build fails on a broken reference
src/lib/watch.ts            watch links and poster URLs
src/components/Timeline.astro, src/pages/index.astro, src/scripts/timeline.ts, src/styles/global.css
```

### Adding or editing a title

Add an object to a file in `src/data/titles/`. The fields are documented in `src/lib/types.ts`.
The important ones:

- `lane`: which universe row it sits on.
- `beat`: its position in the story. Give two titles the same beat to place them in the same column.
- `year`: the label shown, on that universe's own clock.
- `tier`: `essential`, `recommended` or `optional` for the road to Doomsday.
- `crossovers`: other lanes the story reaches into; drawn as a dashed link.
- `main` / `supporting`: character ids. Run `npm run characters:sync` to register new ids, then tidy the
  generated names in `characters.json`. "New characters" is worked out from release dates, not written by hand.
- `watch`: exact streaming links, e.g. `{ "disney": "https://www.disneyplus.com/..." }`. Without one, the
  panel links to a JustWatch search for Indonesia (change the region in `src/lib/watch.ts`).

### Posters

Poster images are not stored here. The poster lookup finds each title on TMDB and saves only the
poster path in `src/data/posters.json`; the page loads the image from TMDB. TMDB's terms do not allow
keeping their data for more than 6 months, and `npm run validate` fails once it is older than 180 days.

It needs a free TMDB **API Read Access Token** (themoviedb.org → Settings → API; the long token,
not the short "API Key"). Never commit the token or paste it into an issue or chat.

**On GitHub (no computer needed).** Add the token once as a repository secret: Settings → Secrets and
variables → Actions → New repository secret, name `TMDB_TOKEN`. Then Actions → Refresh posters →
Run workflow. It also runs by itself on 1 January, May and September, and the site redeploys after.

**On your own computer**, with the repository cloned and `npm install` done:

```sh
# macOS / Linux
TMDB_TOKEN=your-token npm run posters

# Windows PowerShell
$env:TMDB_TOKEN="your-token"; npm run posters
```

Then commit and push `src/data/posters.json`.

## Roadmap

1. **Timeline and titles** (done).
2. **Characters**: a page per character (species, lineage, powers, comic first appearance, MCU status,
   variants), a browsable index, and clickable names in the title panel.
3. **Depth**: filters by phase, saga and character; follow one character's path across the timeline;
   spoiler-safe mode; per-season nodes for long series.
4. **Personal**: watched checklist, progress to Doomsday, offline use, Bahasa Indonesia.
5. **Later**: Secret Wars, team pages, relationship graph, comic reading suggestions.

## Project documents

- [docs/PLAN.md](docs/PLAN.md): goals, design decisions and the phase plan.
- [docs/PROGRESS.md](docs/PROGRESS.md): what is built, open items and next steps. Read this first when picking the project up.
