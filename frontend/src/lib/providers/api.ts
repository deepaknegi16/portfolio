/**
 * Phase 3 provider — reads from the FastAPI backend.
 *
 * ⚠️  NOT YET EXERCISED. The backend does not exist yet (see tasks.md, P3-01).
 * This file is written now so the seam is visible and the Phase 3 work is
 * genuinely "flip an env var", but it stays unverified until P3-05 diffs the
 * rendered output against the static provider.
 *
 * Selecting it today (PUBLIC_DATA_SOURCE=api) will fail at build time with a
 * connection error — which is the correct, loud failure.
 */

import {
  EnrichedProjectSchema,
  ExperienceListSchema,
  ProfileSchema,
  SkillsSchema,
  parseOrThrow,
} from '../schema';
import type { EnrichedProject, Experience, Profile, SkillGroup } from '../schema';
import type { PortfolioDataSource } from './types';
import { z } from 'zod';

/**
 * Empty means same-origin, which is what the compose setup uses: nginx proxies
 * /api/ to the backend container, so the browser and the build both hit the
 * same path. See frontend/nginx/default.conf.
 */
const API_BASE = (import.meta.env.PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

const EnrichedProjectsSchema = z.array(EnrichedProjectSchema);

async function get<T extends z.ZodType>(
  path: string,
  schema: T,
  { allow404 = false }: { allow404?: boolean } = {},
): Promise<z.infer<T> | null> {
  const url = `${API_BASE}/api${path}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    // Distinguish "backend unreachable" from "backend said no" — the two have
    // very different fixes, and a bare TypeError from fetch says neither.
    throw new Error(
      `Cannot reach the portfolio API at ${url}. Is the backend running? ` +
        `Set PUBLIC_DATA_SOURCE=static to build without it.`,
      { cause },
    );
  }

  if (response.status === 404 && allow404) return null;

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
  }

  return parseOrThrow(schema, await response.json(), `GET ${url}`);
}

export const apiProvider: PortfolioDataSource = {
  id: 'api',

  async getProfile(): Promise<Profile> {
    return (await get('/profile', ProfileSchema)) as Profile;
  },

  async getProjects(): Promise<EnrichedProject[]> {
    return (await get('/projects', EnrichedProjectsSchema)) as EnrichedProject[];
  },

  async getProject(slug: string): Promise<EnrichedProject | null> {
    return get(`/projects/${encodeURIComponent(slug)}`, EnrichedProjectSchema, {
      allow404: true,
    });
  },

  async getExperience(): Promise<Experience[]> {
    return (await get('/experience', ExperienceListSchema)) as Experience[];
  },

  async getSkills(): Promise<SkillGroup[]> {
    return (await get('/skills', SkillsSchema)) as SkillGroup[];
  },
};
