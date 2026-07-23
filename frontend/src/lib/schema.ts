/**
 * The data contract for the whole site.
 *
 * These schemas are the canonical shape of portfolio data. Both the static
 * provider (Phase 1, reading JSON files) and the API provider (Phase 3, reading
 * the FastAPI backend) validate through them, so a malformed API response fails
 * in exactly the same place a malformed JSON file does.
 *
 * The Phase 3 Pydantic models mirror this file. Keep them in step — see
 * decisions/0005-fastapi-postgres-later-phases.md
 */

import { z } from 'zod';

/* ── Shared ───────────────────────────────────────────────────────────────── */

/** Lowercase kebab-case, used for URLs: /projects/<slug> */
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case (e.g. "my-project")');

/** "owner/name" as GitHub writes it — the key that links a project to its stats */
const repoRef = z
  .string()
  .regex(/^[\w.-]+\/[\w.-]+$/, 'must be "owner/name" (e.g. "deepaknegi16/Eureka")');

/** "2024", "2024-07", or "2024-07-19" */
const partialDate = z
  .string()
  .regex(/^\d{4}(-\d{2}){0,2}$/, 'must be YYYY, YYYY-MM, or YYYY-MM-DD');

export const SocialLinkSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
  /** Displayed instead of the raw URL when present, e.g. "@deepaknegi16" */
  handle: z.string().optional(),
});

/* ── Profile ──────────────────────────────────────────────────────────────── */

export const ProfileSchema = z.object({
  name: z.string().min(1),
  githubUsername: z.string().min(1),
  role: z.string().min(1),
  /** One line under the name in the hero */
  tagline: z.string().min(1),
  location: z.string().optional(),
  email: z.email().optional(),
  /** e.g. "Open to backend roles" — rendered as a status pill when set */
  availability: z.string().optional(),
  /** One string per paragraph in the About section */
  about: z.array(z.string().min(1)).min(1),
  socials: z.array(SocialLinkSchema).default([]),
  seo: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1),
      /** Absolute URL of the deployed site; used for canonical + OG tags */
      siteUrl: z.url().optional(),
    })
    .optional(),
  /** Set true while placeholder copy is still in place */
  needsContent: z.boolean().default(false),
});

/* ── Projects ─────────────────────────────────────────────────────────────── */

export const ProjectStatusSchema = z.enum([
  'active',
  'maintenance',
  'archived',
  'experiment',
  'planned',
]);

export const ProjectSchema = z.object({
  slug,
  title: z.string().min(1),
  /** One-sentence summary for the card. Kept short on purpose. */
  blurb: z.string().min(1).max(240),
  /** One string per paragraph on the detail page */
  description: z.array(z.string().min(1)).default([]),
  /** Technologies — also the values the grid filter is built from */
  stack: z.array(z.string().min(1)).default([]),
  /** Bullet points on the detail page */
  highlights: z.array(z.string().min(1)).default([]),
  role: z.string().optional(),
  year: partialDate.optional(),
  status: ProjectStatusSchema.default('active'),
  featured: z.boolean().default(false),
  /** Ascending sort key; ties fall back to title */
  order: z.number().int().default(100),
  /** Links this project to GitHub stats. Omit for private/work projects. */
  repo: repoRef.optional(),
  /** Defaults to https://github.com/<repo> when `repo` is set */
  repoUrl: z.url().optional(),
  liveUrl: z.url().optional(),
  /**
   * True when the entry is a scaffolded placeholder rather than real content.
   * The UI marks these visibly — placeholders are never presented as finished
   * work. See decisions/0002-github-as-enrichment-not-source.md
   */
  needsContent: z.boolean().default(false),
});

/* ── GitHub enrichment ────────────────────────────────────────────────────── */

/** Live facts pulled at build time. Never authored by hand. */
export const GitHubRepoStatsSchema = z.object({
  fullName: z.string(),
  name: z.string(),
  description: z.string().nullable().default(null),
  url: z.url(),
  homepage: z.string().nullable().default(null),
  language: z.string().nullable().default(null),
  topics: z.array(z.string()).default([]),
  stars: z.number().int().nonnegative().default(0),
  forks: z.number().int().nonnegative().default(0),
  openIssues: z.number().int().nonnegative().default(0),
  pushedAt: z.string(),
  createdAt: z.string(),
  archived: z.boolean().default(false),
  isFork: z.boolean().default(false),
  license: z.string().nullable().default(null),
  /** Bytes per language, if the extra request succeeded */
  languages: z.record(z.string(), z.number()).default({}),
});

export const GitHubCacheSchema = z.object({
  fetchedAt: z.string(),
  username: z.string(),
  /** Set when the last fetch failed and this cache is a stale fallback */
  stale: z.boolean().default(false),
  /** Keyed by "owner/name" to match Project.repo */
  repos: z.record(z.string(), GitHubRepoStatsSchema).default({}),
});

/** A project after the static provider has merged in whatever GitHub knows. */
export const EnrichedProjectSchema = ProjectSchema.extend({
  github: GitHubRepoStatsSchema.nullable().default(null),
  /** Resolved link: explicit repoUrl, else derived from `repo`, else null */
  resolvedRepoUrl: z.url().nullable().default(null),
});

/* ── Experience ───────────────────────────────────────────────────────────── */

export const ExperienceKindSchema = z.enum(['work', 'education', 'other']);

export const ExperienceSchema = z.object({
  id: slug,
  role: z.string().min(1),
  org: z.string().min(1),
  orgUrl: z.url().optional(),
  kind: ExperienceKindSchema.default('work'),
  start: partialDate,
  /** Omit for an ongoing role — the UI renders "Present" */
  end: partialDate.optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string().min(1)).default([]),
  stack: z.array(z.string().min(1)).default([]),
  needsContent: z.boolean().default(false),
});

/* ── Skills ───────────────────────────────────────────────────────────────── */

export const SkillGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
  note: z.string().optional(),
});

/* ── Collections ──────────────────────────────────────────────────────────── */

export const ProjectsSchema = z.array(ProjectSchema);
export const ExperienceListSchema = z.array(ExperienceSchema);
export const SkillsSchema = z.array(SkillGroupSchema);

/* ── Types ────────────────────────────────────────────────────────────────── */

export type SocialLink = z.infer<typeof SocialLinkSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type GitHubRepoStats = z.infer<typeof GitHubRepoStatsSchema>;
export type GitHubCache = z.infer<typeof GitHubCacheSchema>;
export type EnrichedProject = z.infer<typeof EnrichedProjectSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type ExperienceKind = z.infer<typeof ExperienceKindSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;

/* ── Validation helper ────────────────────────────────────────────────────── */

/**
 * Parse `data`, or throw an error that actually says what's wrong and where.
 *
 * Astro surfaces thrown errors during `astro build`, so a typo in projects.json
 * fails the build with "projects.json → [2].blurb: Too big: expected string to
 * have <=240 characters" rather than rendering something subtly broken.
 */
export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  data: unknown,
  source: string,
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const path = issue.path.length ? issue.path.join('.') : '(root)';
        return `  • ${path}: ${issue.message}`;
      })
      .join('\n');

    throw new Error(`Invalid data in ${source}:\n${details}`);
  }

  return result.data;
}
