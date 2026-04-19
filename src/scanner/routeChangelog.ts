import { RouteNode } from './routeScanner';

export interface ChangelogEntry {
  path: string;
  status: 'added' | 'removed' | 'modified';
  timestamp: string;
}

export interface RouteChangelog {
  generatedAt: string;
  entries: ChangelogEntry[];
}

function buildPath(node: RouteNode, prefix = ''): string {
  return prefix ? `${prefix}/${node.segment}` : `/${node.segment}`;
}

function collectPaths(node: RouteNode, prefix = ''): Set<string> {
  const current = buildPath(node, prefix);
  const paths = new Set<string>();
  if (node.hasPage) paths.add(current);
  for (const child of node.children) {
    for (const p of collectPaths(child, current)) paths.add(p);
  }
  return paths;
}

export function computeChangelog(
  previous: RouteNode,
  current: RouteNode
): RouteChangelog {
  const prev = collectPaths(previous);
  const curr = collectPaths(current);

  const entries: ChangelogEntry[] = [];
  const timestamp = new Date().toISOString();

  for (const p of curr) {
    if (!prev.has(p)) entries.push({ path: p, status: 'added', timestamp });
  }
  for (const p of prev) {
    if (!curr.has(p)) entries.push({ path: p, status: 'removed', timestamp });
  }

  entries.sort((a, b) => a.path.localeCompare(b.path));
  return { generatedAt: timestamp, entries };
}

export function formatChangelog(changelog: RouteChangelog): string {
  if (changelog.entries.length === 0) return 'No route changes detected.';
  const lines = [`Route Changelog (${changelog.generatedAt})`, ''];
  for (const e of changelog.entries) {
    const icon = e.status === 'added' ? '+' : e.status === 'removed' ? '-' : '~';
    lines.push(`  [${icon}] ${e.path}`);
  }
  return lines.join('\n');
}
