import { RouteNode } from '../types';

export type PriorityLevel = 'static' | 'dynamic' | 'catch-all' | 'optional-catch-all';

export interface PrioritizedRoute {
  path: string;
  priority: number;
  level: PriorityLevel;
}

export function getLevel(segment: string): PriorityLevel {
  if (segment.startsWith('[[...')) return 'optional-catch-all';
  if (segment.startsWith('[...')) return 'catch-all';
  if (segment.startsWith('[')) return 'dynamic';
  return 'static';
}

export function getPriority(level: PriorityLevel): number {
  switch (level) {
    case 'static': return 3;
    case 'dynamic': return 2;
    case 'catch-all': return 1;
    case 'optional-catch-all': return 0;
  }
}

function buildPath(node: RouteNode, base = ''): string {
  return base ? `${base}/${node.segment}` : node.segment || '/';
}

function walk(node: RouteNode, base: string, results: PrioritizedRoute[]): void {
  const path = buildPath(node, base);
  const level = getLevel(node.segment);
  results.push({ path, priority: getPriority(level), level });
  for (const child of node.children ?? []) {
    walk(child, path, results);
  }
}

export function prioritizeRoutes(root: RouteNode): PrioritizedRoute[] {
  const results: PrioritizedRoute[] = [];
  walk(root, '', results);
  return results.sort((a, b) => b.priority - a.priority);
}

export function formatPriorities(routes: PrioritizedRoute[]): string {
  const lines = routes.map(r =>
    `${r.path.padEnd(40)} [${r.level}] priority=${r.priority}`
  );
  return ['Route Priorities', '='.repeat(60), ...lines].join('\n');
}
