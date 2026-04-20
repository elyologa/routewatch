import * as fs from 'fs';
import * as path from 'path';
import { RouteNode } from '../scanner/routeScanner';

export type HealthStatus = 'healthy' | 'warning' | 'error';

export interface HealthIssue {
  type: 'missing-page' | 'missing-layout' | 'empty-segment' | 'conflict';
  message: string;
}

export interface RouteHealth {
  path: string;
  status: HealthStatus;
  issues: HealthIssue[];
}

export interface HealthReport {
  healthy: number;
  warnings: number;
  errors: number;
  routes: RouteHealth[];
}

function buildPath(node: RouteNode, parent = ''): string {
  const segment = node.segment === '' ? '' : `/${node.segment}`;
  return `${parent}${segment}`;
}

function checkNode(node: RouteNode, fsPath: string, routePath: string): RouteHealth {
  const issues: HealthIssue[] = [];

  const hasPage = fs.existsSync(path.join(fsPath, 'page.tsx'))
    || fs.existsSync(path.join(fsPath, 'page.ts'))
    || fs.existsSync(path.join(fsPath, 'page.jsx'))
    || fs.existsSync(path.join(fsPath, 'page.js'));

  const hasChildren = node.children && node.children.length > 0;

  if (!hasPage && !hasChildren) {
    issues.push({ type: 'empty-segment', message: `Segment "${routePath}" has no page file and no children` });
  }

  if (!hasPage && hasChildren) {
    issues.push({ type: 'missing-page', message: `Segment "${routePath}" has children but no page file` });
  }

  const hasLayout = fs.existsSync(path.join(fsPath, 'layout.tsx'))
    || fs.existsSync(path.join(fsPath, 'layout.ts'));

  if (!hasLayout && node.segment === '') {
    issues.push({ type: 'missing-layout', message: 'Root segment is missing a layout file' });
  }

  const status: HealthStatus = issues.some(i => i.type === 'empty-segment' || i.type === 'missing-layout')
    ? 'error'
    : issues.length > 0
    ? 'warning'
    : 'healthy';

  return { path: routePath || '/', status, issues };
}

function walk(node: RouteNode, fsBase: string, routePath: string, results: RouteHealth[]): void {
  const fsPath = routePath === '/' ? fsBase : path.join(fsBase, routePath);
  results.push(checkNode(node, fsPath, routePath || '/'));
  for (const child of node.children ?? []) {
    const childRoute = buildPath(child, routePath);
    walk(child, fsBase, childRoute, results);
  }
}

export function checkRouteHealth(root: RouteNode, appDir: string): HealthReport {
  const results: RouteHealth[] = [];
  walk(root, appDir, '', results);
  return {
    healthy: results.filter(r => r.status === 'healthy').length,
    warnings: results.filter(r => r.status === 'warning').length,
    errors: results.filter(r => r.status === 'error').length,
    routes: results,
  };
}

export function formatHealthReport(report: HealthReport): string {
  const lines: string[] = [];
  lines.push(`Route Health: ${report.healthy} healthy, ${report.warnings} warnings, ${report.errors} errors\n`);
  for (const route of report.routes) {
    if (route.issues.length === 0) continue;
    const icon = route.status === 'error' ? '✖' : '⚠';
    lines.push(`${icon} ${route.path}`);
    for (const issue of route.issues) {
      lines.push(`    [${issue.type}] ${issue.message}`);
    }
  }
  return lines.join('\n');
}
