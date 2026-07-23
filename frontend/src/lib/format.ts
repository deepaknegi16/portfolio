/**
 * Display formatting helpers. Pure functions, no data access.
 */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "2024" → "2024" · "2024-07" → "Jul 2024" · "2024-07-19" → "Jul 2024" */
export function formatPartialDate(value: string): string {
  const [year, month] = value.split('-');
  if (!month) return year!;
  const index = Number(month) - 1;
  return MONTHS[index] ? `${MONTHS[index]} ${year}` : year!;
}

/** "Nov 2021 — Dec 2023", or "Jan 2024 — Present" when `end` is absent. */
export function formatDateRange(start: string, end?: string): string {
  return `${formatPartialDate(start)} — ${end ? formatPartialDate(end) : 'Present'}`;
}

/**
 * Coarse relative age of an ISO timestamp, e.g. "2 years ago".
 * Resolved at build time, so it is only as fresh as the last build — which is
 * exactly as fresh as the GitHub data it describes.
 */
export function formatRelative(isoDate: string, now: Date = new Date()): string {
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return 'unknown';

  const days = Math.floor((now.getTime() - then.getTime()) / 86_400_000);

  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;

  const months = Math.round(days / 30.44);
  if (months < 12) return months === 1 ? 'a month ago' : `${months} months ago`;

  const years = Math.floor(days / 365.25);
  const remainder = Math.round((days - years * 365.25) / 30.44);
  if (years === 1 && remainder < 2) return 'a year ago';
  return `${years} years ago`;
}

/** 1200 → "1.2k". Used for star counts. */
export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
}

/** Language byte counts → percentage shares, largest first. */
export function languageShares(
  languages: Record<string, number>,
  limit = 3,
): Array<{ name: string; percent: number }> {
  const total = Object.values(languages).reduce((sum, n) => sum + n, 0);
  if (total === 0) return [];

  return Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, bytes]) => ({ name, percent: Math.round((bytes / total) * 100) }));
}

/**
 * Distinct stack values across projects, ordered by how often they appear so
 * the filter bar leads with the technologies that actually dominate the work.
 */
export function collectStacks(projects: Array<{ stack: string[] }>): string[] {
  const counts = new Map<string, number>();

  for (const project of projects) {
    for (const tech of project.stack) {
      counts.set(tech, (counts.get(tech) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tech]) => tech);
}

/** Stable, URL- and attribute-safe key for a stack value. */
export function stackKey(tech: string): string {
  return tech.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** True when any curated field still carries a scaffolded TODO marker. */
export function hasTodo(...values: Array<string | string[] | undefined>): boolean {
  return values.flat().some((value) => typeof value === 'string' && value.includes('TODO:'));
}
