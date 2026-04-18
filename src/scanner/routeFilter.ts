export interface FilterOptions {
  excludePatterns?: string[];
  includePrivate?: boolean;
  includeGroups?: boolean;
}

const DEFAULT_EXCLUDE = ['node_modules', '.next', 'dist'];

export function matchesPattern(segment: string, pattern: string): boolean {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  return regex.test(segment);
}

export function shouldExclude(routePath: string, patterns: string[]): boolean {
  return patterns.some((p) => matchesPattern(routePath, p));
}

export function isPrivateSegment(segment: string): boolean {
  return segment.startsWith('_');
}

export function isGroupSegment(segment: string): boolean {
  return segment.startsWith('(') && segment.endsWith(')');
}

export function filterRoutes(
  routes: string[],
  options: FilterOptions = {}
): string[] {
  const {
    excludePatterns = [],
    includePrivate = false,
    includeGroups = true,
  } = options;

  const allExcludes = [...DEFAULT_EXCLUDE, ...excludePatterns];

  return routes.filter((route) => {
    if (shouldExclude(route, allExcludes)) return false;

    const segments = route.split('/').filter(Boolean);

    if (!includePrivate && segments.some(isPrivateSegment)) return false;
    if (!includeGroups && segments.some(isGroupSegment)) return false;

    return true;
  });
}
