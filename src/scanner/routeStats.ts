import { RouteNode } from './routeScanner';

export interface RouteStats {
  totalRoutes: number;
  staticRoutes: number;
  dynamicRoutes: number;
  catchAllRoutes: number;
  maxDepth: number;
  avgDepth: number;
}

function walk(node: RouteNode, depth: number, acc: { depth: number; dynamic: boolean; catchAll: boolean }[]): void {
  const isDynamic = node.segment.startsWith('[') && !node.segment.startsWith('[...');
  const isCatchAll = node.segment.startsWith('[...');
  if (node.isRoute) {
    acc.push({ depth, dynamic: isDynamic, catchAll: isCatchAll });
  }
  for (const child of node.children ?? []) {
    walk(child, depth + 1, acc);
  }
}

export function computeRouteStats(root: RouteNode): RouteStats {
  const entries: { depth: number; dynamic: boolean; catchAll: boolean }[] = [];
  walk(root, 0, entries);

  const total = entries.length;
  const dynamic = entries.filter(e => e.dynamic).length;
  const catchAll = entries.filter(e => e.catchAll).length;
  const depths = entries.map(e => e.depth);
  const maxDepth = depths.length ? Math.max(...depths) : 0;
  const avgDepth = depths.length ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;

  return {
    totalRoutes: total,
    staticRoutes: total - dynamic - catchAll,
    dynamicRoutes: dynamic,
    catchAllRoutes: catchAll,
    maxDepth,
    avgDepth: Math.round(avgDepth * 100) / 100,
  };
}

export function formatStats(stats: RouteStats): string {
  return [
    `Total routes   : ${stats.totalRoutes}`,
    `Static         : ${stats.staticRoutes}`,
    `Dynamic        : ${stats.dynamicRoutes}`,
    `Catch-all      : ${stats.catchAllRoutes}`,
    `Max depth      : ${stats.maxDepth}`,
    `Avg depth      : ${stats.avgDepth}`,
  ].join('\n');
}
