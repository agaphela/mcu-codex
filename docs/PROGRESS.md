# MCU Codex: progress

Current state and handoff notes. Update this file at the end of every session.
The plan and design decisions are in [PLAN.md](PLAN.md).

**Last updated:** 16 Nov 2026

## Status

| Phase | State |
|---|---|
| 1. Timeline and titles | Built and pushed. Open items below. |
| 2. Characters | Not started. Registry of names and aliases exists. |
| 3. Depth | Not started. |
| 4. Personal use | Not started. |

- Branch: `claude/relaxed-cannon-1gr4n7`. Nothing is merged to `main` and no pull request is open.
- The site is not deployed yet. The workflow in `.github/workflows/deploy.yml` deploys on push to `main`,
  and GitHub Pages must be enabled first (Settings → Pages → Source: GitHub Actions).

## What exists

- Astro site: `npm run dev`, `npm run build`, `npm run validate`.
- 107 titles in `src/data/titles/`, 11 lanes in `src/data/universes.json`, about 550 characters in
  `src/data/characters.json` (name and alias only).
- Timeline with hover card, first-tap card with "See details", detail panel (plot, new, main and
  supporting characters, watch link), previous and next, `#/title/<id>` links, countdown to Doomsday.
- Filters: Main story (23 titles), Recommended, Everything. Orders: story and release.
- Phone layout with time running downward.

### How it was checked

Loaded in headless Chromium at 1440×860 and as a Pixel 7. Looked at: first paint, opening a title,
the Main story filter, the phone timeline, the first-tap card and the phone panel. No script errors
and no sideways scrolling on the phone.

Not looked at closely: the hover card on desktop, release order, the Recommended filter, light and dark
theme differences, keyboard-only use, browsers other than Chromium.

## Open items for Phase 1

1. **Posters: done, not yet seen rendered.** `src/data/posters.json` holds TMDB poster paths for all
   107 titles; every match had the right title and year. The image host (`image.tmdb.org`) is blocked
   in the cloud session, so the posters have not been viewed in the page. Check them on the live site.
   To refresh after adding titles: `TMDB_TOKEN=... npm run posters` (in a cloud session the token is
   injected by the proxy; run with `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`).
   The footer's TMDB logo is loaded from a themoviedb.org address written from memory and not verified;
   if it shows only the text "TMDB", download the official logo from TMDB's logo page into `public/`.
   Poster data was fetched on 16 Nov 2026 and must be refreshed before mid-April 2027 (TMDB's
   6-month limit). The first lookup was run by an AI coding assistant; see the TMDB note in PLAN.md.
   The owner may prefer to re-run `npm run posters` personally.
2. **No direct Disney+ links.** Every title falls back to a JustWatch search for Indonesia. Exact links
   go in a title's `watch` field. Disney+ could not be reached from the cloud session to collect them,
   and the right link format for Disney+ Indonesia is unconfirmed (reports say it still runs on the
   older Hotstar platform).
3. **Facts were written from memory, not checked against a source.** Plots, cast lists, in-universe
   years and tiers need a read-through by someone who knows the films.
4. **Provisional summaries** (flagged in the data and shown with a caveat):
   *Spider-Man: Brand New Day*, *VisionQuest*, *The Punisher: One Last Kill*, *Wonder Man*,
   *Spider-Noir*. *Brand New Day* matters most; its summary comes from search snippets that partly
   disagreed, and its cast list is short.
5. ***Avengers: Doomsday*** is marked `upcoming` with no plot. After release: write the plot, set a real
   beat and year, remove `upcoming`, and correct its cast list (currently from announcements).

## Known simplifications

- One node per series, even where seasons fall at different points in the story.
- The Wolverine in *Deadpool & Wolverine* is a different variant from the Fox films' Logan but shares
  the id `logan`. Split it when Phase 2 adds variants.
- Optional titles have shorter plots (one or two paragraphs) than essential ones.
- Titles left out: *Hulk* (2003), *The Punisher* (1989, 2004), *Punisher: War Zone*, *Ghost Rider* and
  its sequel, *Fantastic Four* (2015), *Howard the Duck*, *Helstrom*, *Hit-Monkey*, *M.O.D.O.K.*,
  *Legion*, *The Gifted*, older animated series, and *Spider-Man: Beyond the Spider-Verse* (unreleased).
- The "Legacy universes" lane groups several unrelated universes on one line.
- On phones, two titles sharing a beat can overlap each other's labels. No titles currently share a
  beat; the layout supports it through `--slot`.

## Next steps, in order

1. Owner review of tiers and plots; fix what is wrong.
2. Enable Pages, merge to `main`, confirm the deployed site loads under `/mcu-codex`.
3. Start Phase 2 as described in PLAN.md, beginning with the character data shape and one profile page.

## Session log

- **16 Nov 2026.** Planned the project with the owner. Built Phase 1: scaffold, data model, layout
  engine, timeline, panel, filters, phone layout, data for 107 titles, validation, poster script,
  deploy workflow. Added these two documents. Fetched poster paths from TMDB.
