import { RouteNode } from '../scanner/routeScanner';

export interface ImpactEntry {
  path: string;
  dependents: string[];
  score: number;
  level: 'critical' | 'high' | 'medium' | 'low';
}

export interface ImpactReport {
  entries: ImpactEntry[];
  totalRoutes: number;
  criticalCount: number;
}

function buildPath(node: RouteNode, parent = ''): string {
  const segment = node.segment === '/' ? '' : `/${node.segment}`;
  return parent + segment || '/';
}

function getLevel(score: number): ImpactEntry['level'] {
  if (score >= 8) return 'critical';
  if (score >= 5) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

function walk(node: RouteNode, allPaths: string[], parent = ''): ImpactEntry[] {
  const path = buildPath(node, parent);
  const results: ImpactEntry[] = [];

  const dependents = allPaths.filter(
    (p) => p !== path && p.startsWith(path === '/' ? '/' : path + '/')
  );
  const score = Math.min(10, dependents.length + (node.isDynamic ? 2 : 0));

  results.push({ path, dependents, score, level: getLevel(score) });

  for (const child of node.children ?? []) {
    results.push(...walk(child, allPaths, path));
  }

  return results;
}

function collectAllPaths(node: RouteNode, parent = ''): string[] {
  const path = buildPath(node, parent);
  const paths: string[] = [path];
  for (const child of node.children ?? []) {
    paths.push(...collectAllPaths(child, path));
  }
  return paths;
}

export function assessImpact(root: RouteNode): ImpactReport {
  const allPaths = collectAllPaths(root);
  const entries = walk(root, allPaths);
  const criticalCount = entries.filter((e) => e.level === 'critical').length;
  return { entries, totalRoutes: entries.length, criticalCount };
}

export function formatImpactReport(report: ImpactReport): string {
  const lines: string[] = [
    `Route Impact Analysis — ${report.totalRoutes} routes, ${report.criticalCount} critical`,
    '',
  ];
  const sorted = [...report.entries].sort((a, b) => b.score - a.score);
  for (const entry of sorted) {
    const badge = `[${entry.level.toUpperCase()}]`.padEnd(10);
    lines.push(`${badge} ${entry.path}  (score: ${entry.score}, dependents: ${entry.dependents.length})`);
  }
  return lines.join('\n');
}
