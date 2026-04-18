import { RouteNode } from './routeScanner';

export interface RouteDiff {
  added: string[];
  removed: string[];
  unchanged: string[];
}

function collectPaths(node: RouteNode, base = ''): string[] {
  const current = base + '/' + node.segment;
  const paths: string[] = [node.routePath ?? current];
  for (const child of node.children ?? []) {
    paths.push(...collectPaths(child, current));
  }
  return paths;
}

export function compareRoutes(
  previous: RouteNode[],
  current: RouteNode[]
): RouteDiff {
  const prevSet = new Set(previous.flatMap(n => collectPaths(n)));
  const currSet = new Set(current.flatMap(n => collectPaths(n)));

  const added = [...currSet].filter(p => !prevSet.has(p));
  const removed = [...prevSet].filter(p => !currSet.has(p));
  const unchanged = [...currSet].filter(p => prevSet.has(p));

  return { added, removed, unchanged };
}

export function formatDiff(diff: RouteDiff): string {
  const lines: string[] = [];
  for (const r of diff.added) lines.push(`+ ${r}`);
  for (const r of diff.removed) lines.push(`- ${r}`);
  if (lines.length === 0) return 'No changes detected.';
  return lines.join('\n');
}
