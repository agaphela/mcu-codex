# MCU Codex: plan

The product plan and the design decisions behind it. For what is built and what is next, see
[PROGRESS.md](PROGRESS.md). For how to run and edit the project, see the [README](../README.md).

## Goal

One page that lets someone catch up on the Marvel story before *Avengers: Doomsday* (18 Dec 2026)
without watching everything. A reader should be able to:

- see every Marvel film and series on a timeline, in story order, across every universe;
- hover a title to see its poster and name, and click it to read the plot and cast;
- switch to "Main story" and read only the essential plots, one after another, on one page;
- jump to where they can watch a title;
- (Phase 2 onward) open any character and read who they are, with or without starting from a film.

The owner is in Indonesia, so watch links and any future translation target that market.

## Decisions made with the owner

| Topic | Decision |
|---|---|
| Scope | All Marvel films including Sony and Fox, and all series including Netflix. |
| Order of work | Phase 1 timeline and titles, Phase 2 characters, then the rest. |
| Touch | First tap shows a card with a visible "See details" button; that opens the full panel. |
| Streaming | Indonesia. Disney+ Hotstar was rebranded Disney+ there in Oct 2025. |
| Posters | Real posters wanted. Sourced from TMDB; image files are never committed. |
| Plot text | Original summaries, full spoilers: one sentence for the card, paragraphs for the panel. |

## Core model

Each universe has its own clock, so the shared axis cannot be a year.

- **Lane**: a universe or timeline (a row on wide screens). Defined in `src/data/universes.json`.
- **Beat**: a title's position in the story, a number shared by all lanes. Equal beats mean "at the
  same moment" and land in the same column. It is an ordering key only.
- **Year**: a label on the lane's own clock ("2012", "1960s", "Outside time").
- **Crossover**: a title reaching into other lanes, drawn as a dashed link at that title's column.
- **Tier**: `essential`, `recommended` or `optional`, meaning how much it matters for Doomsday.

Example: *Logan* is labelled 2029 but its beat sits just before *Deadpool & Wolverine* (2024), because
that is where it falls in the story.

Beats for the main universe follow in-universe years with decimals for order (2024.8 is late 2024).
Other universes use their own years on the same scale, nudged so real crossover points line up.
Avoid giving two unrelated titles the same beat: a shared column is a claim of simultaneity.

## Architecture

Static site, no backend: Astro + TypeScript, deployable to GitHub Pages.

- **Data is content.** Titles, lanes and characters are JSON files. `src/lib/types.ts` documents every field.
- **Validation at build.** `src/lib/validate.ts` rejects unknown lanes or characters, duplicate ids and
  two titles on the same lane and beat. The build and `npm run validate` both fail on errors.
- **Derived, not authored.** A title's "new characters" are computed from release dates in
  `src/lib/data.ts`. A character's list of appearances must be derived the same way in Phase 2.
- **One layout engine.** `src/lib/layout.ts` is a pure function from titles to grid positions. The build
  uses it for first paint and the browser reuses it when order or filter changes.
- **Orientation in CSS.** Positions are CSS variables (`--col`, `--row`, `--slot`). Wide screens map
  them to columns and rows; under 760px the same variables are transposed so time runs downward.
- **No framework in the browser.** `src/scripts/timeline.ts` is plain TypeScript: card, panel, routing
  (`#/title/<id>`), preferences, drag and wheel panning.

### Constraints to respect

- **Posters are copyrighted.** Store TMDB poster paths only (`src/data/posters.json`), load images from
  TMDB, and keep the TMDB logo and their exact required notice in the footer (API Terms of Use, section 3).
- **TMDB API terms** (read 17 Nov 2026, version dated 20 Oct 2023). The ones that bind this project:
  no commercial use (no ads, fees, or revenue of any kind); TMDB data may not be kept longer than
  6 months, so `npm run posters` must be re-run at least every 5 months (`npm run validate` fails
  past 180 days); posters must be shown unaltered; the API and its content must not be used with or
  to train an AI or machine-learning application, so do not add AI features that touch TMDB data.
  TMDB's general Terms of Use (read 17 Nov 2026, version dated 10 May 2024) add: do not use their
  material with a chatbot or other AI system, do not reach their website by automated means, and
  do not alter their material. In practice: **an AI session should not run `npm run posters` or fetch
  anything from themoviedb.org; the owner runs the poster lookup by hand.** The TMDB logo should be
  the official file, downloaded by the owner and stored in `public/`, not loaded from their website.
- **Watch links cannot detect a subscription or an installed app.** A plain https link is correct: the
  phone opens the app if installed, and the service handles sign-in. Per-title links live in a title's
  `watch` field; without one the panel falls back to a JustWatch search for Indonesia.
- **Summaries must be original writing**, not copied from wikis or reviews.
- **No secrets in the repo.** The TMDB token is passed as an environment variable.

## Phases

### Phase 1: timeline and titles (built)

Lane and beat grid, hover and first-tap card, detail panel, tier filter, story and release order,
phone layout, watch links, validation, deploy workflow, data for 107 titles.

### Phase 2: characters

Goal: every character name is a link to a profile, and characters can be browsed on their own.

- **Data.** Extend `Character` in `types.ts` and `characters.json` (or split into
  `src/data/characters/*.json` once entries get long):
  `species`, `origin` (lane id), `affiliations`, `family` (character ids with a relation),
  `powers`, `comicDebut` (issue and year), `status` (alive, dead, unknown, with a note),
  `portrayedBy`, `variantOf` (id of the base character), `bio` (paragraphs).
- **Variants.** Ids already separate versions by suffix (`peter-parker-raimi`, `charles-xavier-838`).
  `variantOf` should group them so a profile can list its other-universe versions.
- **Pages.** `src/pages/characters/[id].astro` generated per character, and
  `src/pages/characters/index.astro` with search and filters (universe, team, species).
- **Derived appearances.** Each profile lists the titles the character is in, with role, built from the
  title data. Link each back to `/#/title/<id>`.
- **Panel.** Turn the character chips in the title panel into links (they already carry
  `data-character`).
- **Order of writing.** Start with characters in `essential` titles, then `recommended`, then the rest.
  There are about 550 ids, so profiles for minor characters can stay as name-only stubs at first.

### Phase 3: depth

- Follow one character: highlight their titles across the timeline.
- Filters by phase, saga and lane; text search for titles.
- Spoiler-safe mode that hides plots for titles not marked as watched.
- Split long series into one node per season where seasons sit at different points in the story
  (*Loki*, *Daredevil: Born Again*, *What If…?*, *Agents of S.H.I.E.L.D.*).

### Phase 4: personal use

- Watched checklist and "left before Doomsday" progress, stored on the device.
- Offline support.
- Bahasa Indonesia translation of interface and summaries.

### Later

- *Avengers: Secret Wars* (17 Dec 2027) and anything released after Doomsday.
- Team pages (Avengers, X-Men, Fantastic Four), a relationship graph, comic reading suggestions.

## Working rules for any session

1. Read [PROGRESS.md](PROGRESS.md) first, and update it before ending a session.
2. Run `npm run validate` and `npm run build` before committing.
3. Check interface changes in a browser at desktop and phone widths.
4. Mark any summary written from thin sources with `"provisional": true`.
5. Record new decisions made with the owner in the table above.
