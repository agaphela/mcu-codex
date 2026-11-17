import type { Title } from './types';

/**
 * Builds the "watch" links for a title.
 *
 * A normal https link is all that is needed: on a phone with the streaming app
 * installed the operating system opens the app, otherwise the browser opens,
 * and the service itself handles sign-in and subscription.
 */

export interface WatchLink {
  label: string;
  url: string;
  primary: boolean;
}

/** Reader's market. Used for the availability search. */
export const REGION = { code: 'id', name: 'Indonesia' };

const SERVICE_LABELS: Record<string, string> = {
  disney: 'Watch on Disney+',
  netflix: 'Watch on Netflix',
  prime: 'Watch on Prime Video',
};

export function watchLinks(title: Pick<Title, 'title' | 'watch' | 'upcoming'>): WatchLink[] {
  const links: WatchLink[] = Object.entries(title.watch ?? {}).map(([service, url]) => ({
    label: SERVICE_LABELS[service] ?? `Watch on ${service}`,
    url,
    primary: true,
  }));

  if (!title.upcoming) {
    links.push({
      label: links.length ? `Other options in ${REGION.name}` : `Where to watch in ${REGION.name}`,
      url: `https://www.justwatch.com/${REGION.code}/search?q=${encodeURIComponent(title.title)}`,
      primary: links.length === 0,
    });
  }
  return links;
}

export const POSTER_BASE = 'https://image.tmdb.org/t/p/';

export function posterUrl(path: string | undefined, size: 'w154' | 'w342' = 'w342'): string | null {
  return path ? `${POSTER_BASE}${size}${path}` : null;
}
