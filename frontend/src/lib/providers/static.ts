/**
 * Phase 1 provider — reads the curated JSON files and merges in build-time
 * GitHub stats.
 *
 * Curated fields always win over fetched ones; GitHub only supplies facts that
 * cannot be hand-authored (stars, forks, language breakdown, last push).
 * See decisions/0002-github-as-enrichment-not-source.md
 */

import profileRaw from '../../data/profile.json';
import projectsRaw from '../../data/projects.json';
import experienceRaw from '../../data/experience.json';
import skillsRaw from '../../data/skills.json';
import githubCacheRaw from '../../data/github-cache.json';

import {
  ExperienceListSchema,
  GitHubCacheSchema,
  ProfileSchema,
  ProjectsSchema,
  SkillsSchema,
  parseOrThrow,
} from '../schema';
import type { EnrichedProject, Experience, Profile, Project, SkillGroup } from '../schema';
import type { PortfolioDataSource } from './types';

/* Parsed once at module load — these are build-time constants. */

const profile = parseOrThrow(ProfileSchema, profileRaw, 'src/data/profile.json');
const projects = parseOrThrow(ProjectsSchema, projectsRaw, 'src/data/projects.json');
const experience = parseOrThrow(
  ExperienceListSchema,
  experienceRaw,
  'src/data/experience.json',
);
const skills = parseOrThrow(SkillsSchema, skillsRaw, 'src/data/skills.json');
const githubCache = parseOrThrow(
  GitHubCacheSchema,
  githubCacheRaw,
  'src/data/github-cache.json',
);

/* Slugs are URLs — a duplicate would silently shadow a page. */
const duplicateSlugs = projects
  .map((p) => p.slug)
  .filter((slugValue, index, all) => all.indexOf(slugValue) !== index);

if (duplicateSlugs.length > 0) {
  throw new Error(
    `Duplicate project slugs in src/data/projects.json: ${[...new Set(duplicateSlugs)].join(', ')}`,
  );
}

/** Attach GitHub stats and resolve the canonical repo link. */
function enrich(project: Project): EnrichedProject {
  const github = project.repo ? (githubCache.repos[project.repo] ?? null) : null;

  const resolvedRepoUrl =
    project.repoUrl ?? (project.repo ? `https://github.com/${project.repo}` : null);

  return { ...project, github, resolvedRepoUrl };
}

/**
 * Featured first, then by explicit `order`, then alphabetically so the sort is
 * total and the build output is deterministic.
 */
function byDisplayOrder(a: EnrichedProject, b: EnrichedProject): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title);
}

/** Most recent first; ongoing entries (no `end`) sort to the top. */
function byRecency(a: Experience, b: Experience): number {
  const endA = a.end ?? '9999';
  const endB = b.end ?? '9999';
  if (endA !== endB) return endB.localeCompare(endA);
  return b.start.localeCompare(a.start);
}

export const staticProvider: PortfolioDataSource = {
  id: 'static',

  async getProfile(): Promise<Profile> {
    return profile;
  },

  async getProjects(): Promise<EnrichedProject[]> {
    return projects.map(enrich).sort(byDisplayOrder);
  },

  async getProject(slug: string): Promise<EnrichedProject | null> {
    const match = projects.find((p) => p.slug === slug);
    return match ? enrich(match) : null;
  },

  async getExperience(): Promise<Experience[]> {
    return [...experience].sort(byRecency);
  },

  async getSkills(): Promise<SkillGroup[]> {
    return skills;
  },
};

/** Exposed so the footer can honestly say how fresh the GitHub numbers are. */
export const githubMeta = {
  fetchedAt: githubCache.fetchedAt,
  stale: githubCache.stale,
  username: githubCache.username,
};
