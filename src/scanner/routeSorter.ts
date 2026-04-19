export type SortKey = 'path' | 'depth' | 'type';

export interface SortOptions {
  key: SortKey;
  order?: 'asc' | 'desc';
}

export interface SortableRoute {
  path: string;
  depth: number;
  isDynamic: boolean;
  isCatchAll: boolean;
}

function getTypeRank(route: SortableRoute): number {
  if (route.isCatchAll) return 2;
  if (route.isDynamic) return 1;
  return 0;
}

function compareRoutes(a: SortableRoute, b: SortableRoute, key: SortKey): number {
  switch (key) {
    case 'path':
      return a.path.localeCompare(b.path);
    case 'depth':
      return a.depth - b.depth;
    case 'type':
      return getTypeRank(a) - getTypeRank(b);
    default:
      return 0;
  }
}

export function sortRoutes(
  routes: SortableRoute[],
  options: SortOptions = { key: 'path', order: 'asc' }
): SortableRoute[] {
  const { key, order = 'asc' } = options;
  const sorted = [...routes].sort((a, b) => compareRoutes(a, b, key));
  return order === 'desc' ? sorted.reverse() : sorted;
}

export function buildSortableRoute(path: string): SortableRoute {
  const segments = path.split('/').filter(Boolean);
  return {
    path,
    depth: segments.length,
    isDynamic: segments.some(s => s.startsWith('[') && !s.startsWith('[...')),
    isCatchAll: segments.some(s => s.startsWith('[...')),
  };
}
