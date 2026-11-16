import { computeLayout, type Layout } from '../lib/layout';
import { posterUrl, watchLinks } from '../lib/watch';
import type { CodexData, Order, TierFilter, Title } from '../lib/types';

const data: CodexData = JSON.parse(document.getElementById('codex-data')!.textContent!);
const titleById = new Map(data.titles.map((t) => [t.id, t]));
const laneById = new Map(data.lanes.map((l) => [l.id, l]));
const laneIds = data.lanes.map((l) => l.id);

const timeline = document.getElementById('timeline')!;
const scroller = document.getElementById('scroller')!;
const card = document.getElementById('card')!;
const panel = document.getElementById('panel')!;

const state: { order: Order; tier: TierFilter; selected: string | null } = {
  order: 'story',
  tier: 'all',
  selected: null,
};
let layout: Layout;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const nodeEl = (id: string) => timeline.querySelector<HTMLElement>(`.node[data-id="${id}"]`);

/* ── Preferences (a convenience only; the page works without storage) ── */

function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem('codex-prefs') ?? '{}');
    if (saved.order === 'story' || saved.order === 'release') state.order = saved.order;
    if (['all', 'recommended', 'essential'].includes(saved.tier)) state.tier = saved.tier;
  } catch {
    /* storage unavailable */
  }
}

function savePrefs() {
  try {
    localStorage.setItem('codex-prefs', JSON.stringify({ order: state.order, tier: state.tier }));
  } catch {
    /* storage unavailable */
  }
}

/* ── Layout ── */

function applyLayout() {
  layout = computeLayout(data.titles, laneIds, state);
  timeline.style.setProperty('--n', String(layout.cols));

  timeline.querySelectorAll<HTMLElement>('[data-id]').forEach((el) => {
    const pos = layout.nodes[el.dataset.id!];
    el.hidden = !pos;
    if (!pos) return;
    el.style.setProperty('--col', String(pos.col));
    el.style.setProperty('--slot', String(pos.slot));
    const year = el.querySelector('.yr');
    const t = titleById.get(el.dataset.id!)!;
    if (year) year.textContent = state.order === 'story' ? t.year : t.release.slice(0, 4);
  });

  timeline.querySelectorAll<HTMLElement>('.lane-line').forEach((el) => {
    const span = layout.spans[el.dataset.lane!];
    el.hidden = !span;
    if (!span) return;
    el.style.setProperty('--c0', String(span[0]));
    el.style.setProperty('--c1', String(span[1]));
  });

  // Connectors mean "at the same moment", which only holds in story order.
  timeline.querySelectorAll<HTMLElement>('.link').forEach((el) => {
    const link = layout.connectors.find((c) => c.id === el.dataset.link);
    el.hidden = !link || state.order !== 'story';
    if (!link) return;
    el.style.setProperty('--col', String(link.col));
    el.style.setProperty('--r0', String(link.r0));
    el.style.setProperty('--r1', String(link.r1));
  });

  document.querySelectorAll<HTMLElement>('[data-order]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.order === state.order));
  });
  document.querySelectorAll<HTMLElement>('[data-tier]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.tier === state.tier));
  });

  if (state.selected) {
    if (layout.nodes[state.selected]) {
      renderPanel(titleById.get(state.selected)!);
      centre(state.selected, 'auto');
    } else closePanel();
  }
}

function centre(id: string, behavior: ScrollBehavior = 'smooth') {
  nodeEl(id)?.scrollIntoView({ block: 'center', inline: 'center', behavior });
}

/* ── Poster ── */

function posterHtml(t: Title, size: 'w154' | 'w342') {
  const url = posterUrl(data.posters[t.id], size);
  const lane = laneById.get(t.lane)!;
  return url
    ? `<img class="poster" src="${esc(url)}" alt="Poster for ${esc(t.title)}" loading="lazy" />`
    : `<div class="poster placeholder" style="--lane:${lane.color}">${esc(t.title)}</div>`;
}

function metaLine(t: Title) {
  const released = t.upcoming ? `In cinemas ${formatDate(t.release)}` : `Released ${t.release.slice(0, 4)}`;
  return `Set in ${esc(t.year)} · ${released}`;
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/* ── Card (hover on desktop, first tap on touch) ── */

let cardId: string | null = null;
let hideTimer = 0;

function showCard(id: string, anchor: HTMLElement) {
  const t = titleById.get(id)!;
  const lane = laneById.get(t.lane)!;
  clearTimeout(hideTimer);
  cardId = id;
  card.innerHTML = `
    ${posterHtml(t, 'w154')}
    <div>
      <h2>${esc(t.title)}</h2>
      <p>${metaLine(t)}</p>
      <p>${esc(lane.name)}</p>
      <button type="button" class="more">See details ›</button>
    </div>`;
  card.hidden = false;

  const a = anchor.getBoundingClientRect();
  const c = card.getBoundingClientRect();
  const gap = 14;
  let left = a.left + a.width / 2 - c.width / 2;
  let top = a.bottom + gap;
  if (top + c.height > innerHeight - 8) top = a.top - c.height - gap;
  left = Math.max(8, Math.min(left, innerWidth - c.width - 8));
  top = Math.max(8, top);
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
}

function hideCard() {
  clearTimeout(hideTimer);
  cardId = null;
  card.hidden = true;
}

/* ── Detail panel ── */

function characterList(ids: string[]) {
  return `<ul class="chips">${ids
    .map((id) => {
      const c = data.characters[id];
      const alias = c.alias ? ` <small>${esc(c.alias)}</small>` : '';
      return `<li data-character="${esc(id)}">${esc(c.name)}${alias}</li>`;
    })
    .join('')}</ul>`;
}

function renderPanel(t: Title) {
  const lane = laneById.get(t.lane)!;
  const index = layout.sequence.indexOf(t.id);
  const tierLabel = { essential: 'Main story', recommended: 'Recommended', optional: 'Optional' }[t.tier];
  const typeLabel = { film: 'Film', series: 'Series', special: 'Special' }[t.type];
  const crossed = (t.crossovers ?? []).map((id) => laneById.get(id)!.name);
  const section = (heading: string, ids: string[]) =>
    ids.length ? `<h3>${heading}</h3>${characterList(ids)}` : '';

  panel.innerHTML = `
    <div class="panel-nav">
      <button type="button" data-step="-1" ${index <= 0 ? 'disabled' : ''}>‹ Previous</button>
      <span class="pos">${index + 1} of ${layout.sequence.length}</span>
      <button type="button" data-step="1" ${index >= layout.sequence.length - 1 ? 'disabled' : ''}>Next ›</button>
      <button type="button" data-close aria-label="Close details">✕</button>
    </div>
    <div class="panel-body">
      <div class="hero">
        ${posterHtml(t, 'w342')}
        <div>
          <h2>${esc(t.title)}</h2>
          <ul class="chips">
            <li class="tier-${t.tier}">${tierLabel}</li>
            <li>${typeLabel}</li>
            ${t.phase ? `<li>Phase ${t.phase}</li>` : ''}
            <li>Set in ${esc(t.year)}</li>
            <li>${t.upcoming ? 'In cinemas' : 'Released'} ${formatDate(t.release)}</li>
            <li class="lane-chip" style="--lane:${lane.color}">${esc(lane.name)}</li>
          </ul>
        </div>
      </div>
      <div class="watch">
        ${watchLinks(t)
          .map(
            (w) =>
              `<a class="${w.primary ? 'primary' : ''}" href="${esc(w.url)}" target="_blank" rel="noopener">${esc(w.label)} ↗</a>`,
          )
          .join('')}
      </div>
      <p class="short">${esc(t.short)}</p>
      <h3>${t.upcoming ? 'What we know' : 'Plot (full spoilers)'}</h3>
      ${t.provisional ? '<p class="caveat">This summary was written from limited sources and may be incomplete.</p>' : ''}
      <div class="plot">${t.plot.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      ${crossed.length ? `<h3>Crosses into</h3><ul class="chips">${crossed.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      ${section('New characters', t.debuts)}
      ${section('Main characters', t.main)}
      ${section('Supporting characters', t.supporting)}
    </div>`;
  panel.hidden = false;
  panel.scrollTop = 0;
}

function select(id: string, updateHash = true) {
  const t = titleById.get(id);
  if (!t) return;
  // A title hidden by the current filter is still reachable by link: widen the filter.
  if (!layout.nodes[id]) {
    state.tier = 'all';
    state.selected = id;
    applyLayout();
  }
  hideCard();
  timeline.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
  timeline.querySelectorAll(`[data-id="${id}"]`).forEach((el) => el.classList.add('active'));
  state.selected = id;
  renderPanel(t);
  centre(id);
  if (updateHash) history.replaceState(null, '', `#/title/${id}`);
}

function closePanel() {
  state.selected = null;
  panel.hidden = true;
  timeline.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
  history.replaceState(null, '', location.pathname + location.search);
}

function step(delta: number) {
  if (!state.selected) return;
  const next = layout.sequence[layout.sequence.indexOf(state.selected) + delta];
  if (next) select(next);
}

function selectFromHash() {
  const match = location.hash.match(/^#\/title\/([a-z0-9-]+)$/);
  if (match && titleById.has(match[1])) select(match[1], false);
}

/* ── Events ── */

let lastPointer = 'mouse';
let dragged = false;

document.addEventListener('pointerdown', (e) => (lastPointer = e.pointerType), true);

timeline.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
  if (el) showCard(el.dataset.id!, nodeEl(el.dataset.id!) ?? el);
});

timeline.addEventListener('pointerout', (e) => {
  if (e.pointerType !== 'mouse') return;
  if ((e.target as HTMLElement).closest('[data-id]')) hideTimer = window.setTimeout(hideCard, 180);
});

timeline.addEventListener('focusin', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('.node');
  if (el && el.matches(':focus-visible')) showCard(el.dataset.id!, el);
});

card.addEventListener('pointerenter', () => clearTimeout(hideTimer));
card.addEventListener('pointerleave', (e) => {
  if (e.pointerType === 'mouse') hideTimer = window.setTimeout(hideCard, 180);
});
card.addEventListener('click', () => {
  if (cardId) select(cardId);
});

timeline.addEventListener('click', (e) => {
  if (dragged) return;
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
  if (!el) return;
  const id = el.dataset.id!;
  // Touch has no hover: the first tap previews, the card's "See details" (or a second tap) opens.
  if (lastPointer !== 'mouse' && cardId !== id) showCard(id, nodeEl(id) ?? el);
  else select(id);
});

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('[data-id]') && !target.closest('#card')) hideCard();

  const orderBtn = target.closest<HTMLElement>('[data-order]');
  const tierBtn = target.closest<HTMLElement>('[data-tier]');
  if (orderBtn) state.order = orderBtn.dataset.order as Order;
  if (tierBtn) state.tier = tierBtn.dataset.tier as TierFilter;
  if (orderBtn || tierBtn) {
    savePrefs();
    applyLayout();
  }

  const stepBtn = target.closest<HTMLElement>('[data-step]');
  if (stepBtn) step(Number(stepBtn.dataset.step));
  if (target.closest('[data-close]')) closePanel();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!card.hidden) hideCard();
    else if (state.selected) closePanel();
  }
  if (!state.selected || (e.target as HTMLElement).closest('input, textarea')) return;
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft') step(-1);
});

scroller.addEventListener('scroll', () => {
  if (lastPointer !== 'mouse') hideCard();
});

window.addEventListener('hashchange', selectFromHash);

/* Mouse: drag to pan, and let a plain wheel scroll the timeline sideways. */

const wide = matchMedia('(min-width: 761px)');
let drag: { x: number; y: number; left: number; top: number } | null = null;

scroller.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.button !== 0 || (e.target as HTMLElement).closest('.foot')) return;
  drag = { x: e.clientX, y: e.clientY, left: scroller.scrollLeft, top: scroller.scrollTop };
  dragged = false;
});

window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  if (!dragged && Math.hypot(dx, dy) < 6) return;
  dragged = true;
  hideCard();
  scroller.classList.add('dragging');
  scroller.scrollLeft = drag.left - dx;
  scroller.scrollTop = drag.top - dy;
});

window.addEventListener('pointerup', () => {
  drag = null;
  scroller.classList.remove('dragging');
  // Let the click that ends a drag be ignored, then re-arm.
  setTimeout(() => (dragged = false));
});

scroller.addEventListener(
  'wheel',
  (e) => {
    if (!wide.matches || e.shiftKey || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (scroller.scrollHeight > scroller.clientHeight + 1) return;
    scroller.scrollLeft += e.deltaY;
    e.preventDefault();
  },
  { passive: false },
);

/* ── Countdown ── */

function renderCountdown() {
  const doomsday = data.titles.find((t) => t.id === 'avengers-doomsday');
  const el = document.getElementById('countdown');
  if (!doomsday || !el) return;
  const days = Math.ceil((Date.parse(doomsday.release) - Date.now()) / 86_400_000);
  if (days > 0) el.textContent = `· ${days} day${days === 1 ? '' : 's'} to go`;
}

loadPrefs();
applyLayout();
renderCountdown();
selectFromHash();
