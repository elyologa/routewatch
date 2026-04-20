import { RouteNode } from '../scanner/routeScanner';

export interface RouteComplexity {
  path: string;
  depth: number;
  dynamicSegments: number;
  catchAllSegments: number;
  score: number;
  level: 'low' | 'medium' | 'high';
}

export interface ComplexityReport {
  routes: RouteComplexity[];
  averageScore: number;
  mostComplex: RouteComplexity | null;
}

function buildPath(node: RouteNode, parent = ''): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function isDynamic(segment: string): boolean {
  return segment.startsWith('[') && !segment.startsWith('[...');
}

function isCatchAll(segment: string): boolean {
  return segment.startsWith('[...');
}

function getLevel(score: number): 'low' | 'medium' | 'high' {
  if (score <= 3) return 'low';
  if (score <= 7) return 'medium';
  return 'high';
}

function walk(node: RouteNode, parent: string, results: RouteComplexity[]): void {
  const path = buildPath(node, parent);
  const segments = path.split('/').filter(Boolean);
  const depth = segments.length;
  const dynamicSegments = segments.filter(isDynamic).length;
  const catchAllSegments = segments.filter(isCatchAll).length;
  const score = depth + dynamicSegments * 2 + catchAllSegments * 3;

  if (node.isPage || node.isLayout) {
    results.push({ path, depth, dynamicSegments, catchAllSegments, score, level: getLevel(score) });
  }

  for (const child of node.children ?? []) {
    walk(child, path, results);
  }
}

export function analyzeComplexity(root: RouteNode): ComplexityReport {
  const routes: RouteComplexity[] = [];
  walk(root, '', routes);

  const averageScore =
    routes.length > 0
      ? Math.round((routes.reduce((sum, r) => sum + r.score, 0) / routes.length) * 10) / 10
      : 0;

  const mostComplex = routes.reduce<RouteComplexity | null>(
    (best, r) => (best === null || r.score > best.score ? r : best),
    null
  );

  return { routes, averageScore, mostComplex };
}

export function formatComplexityReport(report: ComplexityReport): string {
  const lines: string[] = ['Route Complexity Report', '======================='];

  for (const r of report.routes) {
    const badge = r.level === 'high' ? '🔴' : r.level === 'medium' ? '🟡' : '🟢';
    lines.push(`${badge} ${r.path}  (score: ${r.score}, depth: ${r.depth}, dynamic: ${r.dynamicSegments}, catch-all: ${r.catchAllSegments})`);
  }

  lines.push('');
  lines.push(`Average score : ${report.averageScore}`);
  if (report.mostComplex) {
    lines.push(`Most complex  : ${report.mostComplex.path} (score: ${report.mostComplex.score})`);
  }

  return lines.join('\n');
}
