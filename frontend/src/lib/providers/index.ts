/**
 * Picks the active data source. This module is the ONLY place the choice is
 * made, and the only thing Phase 3 changes is the environment variable that
 * drives it.
 *
 *   PUBLIC_DATA_SOURCE=static   JSON files          (Phase 1–2, default)
 *   PUBLIC_DATA_SOURCE=api      FastAPI backend     (Phase 3+)
 */

import { staticProvider, githubMeta } from './static';
import { apiProvider } from './api';
import type { PortfolioDataSource } from './types';

const configured = import.meta.env.PUBLIC_DATA_SOURCE ?? 'static';

if (configured !== 'static' && configured !== 'api') {
  throw new Error(
    `PUBLIC_DATA_SOURCE must be "static" or "api", got "${configured}". ` +
      `Check your .env file.`,
  );
}

export const dataSource: PortfolioDataSource =
  configured === 'api' ? apiProvider : staticProvider;

/*
 * Bound methods, so components can `import { getProjects }` and call it without
 * dragging the provider object around.
 */
export const getProfile = () => dataSource.getProfile();
export const getProjects = () => dataSource.getProjects();
export const getProject = (slug: string) => dataSource.getProject(slug);
export const getExperience = () => dataSource.getExperience();
export const getSkills = () => dataSource.getSkills();

/**
 * How fresh the committed GitHub cache is — static provider only. Null under
 * the API provider, where the backend owns freshness instead.
 *
 * Re-exported here so components never import a specific provider: the rule is
 * that `providers/index` is the only module they touch.
 */
export const githubFreshness = dataSource.id === 'static' ? githubMeta : null;

export type { PortfolioDataSource } from './types';
