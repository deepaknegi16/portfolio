/**
 * The data seam.
 *
 * Every page and component reads portfolio data through this interface and
 * nothing else — no direct JSON imports, no direct `fetch`. That is what makes
 * the Phase 3 swap (JSON files → FastAPI) a one-line environment change rather
 * than a rewrite.
 *
 * See decisions/0006-provider-abstraction-over-content-collections.md
 */

import type { EnrichedProject, Experience, Profile, SkillGroup } from '../schema';

export interface PortfolioDataSource {
  /** Identifies the active implementation; surfaced in build logs. */
  readonly id: 'static' | 'api';

  getProfile(): Promise<Profile>;
  getProjects(): Promise<EnrichedProject[]>;
  /** Null rather than throwing, so pages can render a 404 instead of crashing. */
  getProject(slug: string): Promise<EnrichedProject | null>;
  getExperience(): Promise<Experience[]>;
  getSkills(): Promise<SkillGroup[]>;
}

/**
 * Every method is async even though the static implementation resolves
 * synchronously underneath. Doing this from day one means Phase 3 does not
 * change a single call site's signature.
 *
 * Keep this interface narrow: every method added here is a method the Phase 3
 * backend must also implement.
 */
