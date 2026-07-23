#!/usr/bin/env node
/**
 * Build-time GitHub enrichment.
 *
 * Fetches public repo metadata for the username in src/data/profile.json and
 * writes src/data/github-cache.json, which the static provider merges into the
 * curated project entries.
 *
 * This script FAILS SOFT by design. It runs as a `prebuild` hook, including
 * inside `docker build` where the network may be unavailable or rate-limited.
 * On any failure it keeps the committed cache, marks it stale, and exits 0 —
 * a portfolio build must never break because github.com had a bad minute.
 *
 * See decisions/0002-github-as-enrichment-not-source.md
 *
 * Usage:  node scripts/fetch-github.mjs [--strict]
 *   --strict   exit non-zero on failure (useful in CI, never in a build)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROFILE_PATH = resolve(HERE, '../src/data/profile.json');
const CACHE_PATH = resolve(HERE, '../src/data/github-cache.json');

const STRICT = process.argv.includes('--strict');
const TOKEN = process.env.GITHUB_TOKEN?.trim();
const TIMEOUT_MS = 10_000;

const log = (msg) => console.log(`[fetch-github] ${msg}`);
const warn = (msg) => console.warn(`[fetch-github] ⚠ ${msg}`);

/** Fetch JSON with a timeout, throwing a message that names the actual problem. */
async function ghFetch(path) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'portfolio-build-script',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const response = await fetch(`https://api.github.com${path}`, {
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (remaining === '0') {
      const resetAt = new Date(
        Number(response.headers.get('x-ratelimit-reset') ?? 0) * 1000,
      );
      throw new Error(
        `rate limited until ${resetAt.toISOString()} — ` +
          `set GITHUB_TOKEN to raise the limit from 60/hr to 5000/hr`,
      );
    }
  }

  if (!response.ok) {
    throw new Error(`GET ${path} → ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/** Shape a GitHub API repo into exactly the fields GitHubRepoStatsSchema expects. */
function toStats(repo, languages) {
  return {
    fullName: repo.full_name,
    name: repo.name,
    description: repo.description ?? null,
    url: repo.html_url,
    homepage: repo.homepage || null,
    language: repo.language ?? null,
    topics: repo.topics ?? [],
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    openIssues: repo.open_issues_count ?? 0,
    pushedAt: repo.pushed_at,
    createdAt: repo.created_at,
    archived: Boolean(repo.archived),
    isFork: Boolean(repo.fork),
    license: repo.license?.spdx_id ?? null,
    languages,
  };
}

/** Keep whatever is already committed, but flag it as no longer fresh. */
async function markExistingCacheStale(reason) {
  if (!existsSync(CACHE_PATH)) {
    warn(`${reason} — and no cache exists yet, writing an empty one`);
    const empty = {
      fetchedAt: new Date().toISOString(),
      username: 'unknown',
      stale: true,
      repos: {},
    };
    await writeFile(CACHE_PATH, `${JSON.stringify(empty, null, 2)}\n`);
    return;
  }

  const existing = JSON.parse(await readFile(CACHE_PATH, 'utf8'));
  const count = Object.keys(existing.repos ?? {}).length;
  existing.stale = true;
  await writeFile(CACHE_PATH, `${JSON.stringify(existing, null, 2)}\n`);
  warn(`${reason} — reusing committed cache (${count} repos, fetched ${existing.fetchedAt})`);
}

async function main() {
  const profile = JSON.parse(await readFile(PROFILE_PATH, 'utf8'));
  const username = profile.githubUsername;

  if (!username) {
    throw new Error('profile.json has no "githubUsername"');
  }

  log(`fetching repos for @${username}${TOKEN ? ' (authenticated)' : ''}`);

  const repos = await ghFetch(`/users/${username}/repos?per_page=100&sort=pushed`);

  if (!Array.isArray(repos)) {
    throw new Error(`unexpected response shape: ${typeof repos}`);
  }

  // Language breakdown is one extra request per repo. Done in parallel, and a
  // failure here degrades to an empty object rather than sinking the run.
  const withLanguages = await Promise.all(
    repos.map(async (repo) => {
      try {
        return [repo, await ghFetch(`/repos/${repo.full_name}/languages`)];
      } catch {
        return [repo, {}];
      }
    }),
  );

  const cache = {
    fetchedAt: new Date().toISOString(),
    username,
    stale: false,
    repos: Object.fromEntries(
      withLanguages.map(([repo, languages]) => [repo.full_name, toStats(repo, languages)]),
    ),
  };

  await writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
  log(`wrote ${Object.keys(cache.repos).length} repos to src/data/github-cache.json`);
}

try {
  await main();
} catch (error) {
  await markExistingCacheStale(error.message);
  if (STRICT) {
    console.error('[fetch-github] --strict was set, failing the run');
    process.exit(1);
  }
  log('continuing — the build does not depend on this succeeding');
}
