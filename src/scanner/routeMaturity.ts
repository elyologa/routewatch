import * as fs from 'fs';
import * as path from 'path';
import { RouteNode } from '../scanner/routeScanner';

export type MaturityLevel = 'new' | 'developing' | 'stable' | 'mature';

export interface RouteMaturityInfo {
  path: string;
  maturityLevel: MaturityLevel;
  ageInDays: number;
  hasTests: boolean;
  hasTypes: boolean;
  commitCount: number;
}

export interface MaturityReport {
  routes: RouteMaturityInfo[];
  summary: Record<MaturityLevel, number>;
}

function buildPath(node: RouteNode, parent = ''): string {
  const segment = node.segment === 'page' ? '' : `/${node.segment}`;
  return parent + segment;
}

function getAgeInDays(filePath: string): number {
  try {
    const stat = fs.statSync(filePath);
    const now = Date.now();
    return Math.floor((now - stat.birthtimeMs) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function classifyMaturity(ageInDays: number, hasTests: boolean, hasTypes: boolean): MaturityLevel {
  if (ageInDays < 7) return 'new';
  if (ageInDays < 30) return 'developing';
  if (hasTests && hasTypes) return 'mature';
  return 'stable';
}

function walk(node: RouteNode, dir: string, parentPath: string, results: RouteMaturityInfo[]): void {
  const currentPath = buildPath(node, parentPath);
  const nodeDir = path.join(dir, node.segment);

  const hasTests = fs.existsSync(path.join(nodeDir, 'page.test.tsx')) ||
    fs.existsSync(path.join(nodeDir, 'page.spec.tsx'));
  const hasTypes = fs.existsSync(path.join(nodeDir, 'types.ts')) ||
    fs.existsSync(path.join(nodeDir, 'types.tsx'));

  const pageFile = path.join(nodeDir, 'page.tsx');
  const ageInDays = getAgeInDays(pageFile);
  const maturityLevel = classifyMaturity(ageInDays, hasTests, hasTypes);

  if (node.isPage) {
    results.push({
      path: currentPath || '/',
      maturityLevel,
      ageInDays,
      hasTests,
      hasTypes,
      commitCount: 0,
    });
  }

  for (const child of node.children) {
    walk(child, nodeDir, currentPath, results);
  }
}

export function assessMaturity(root: RouteNode, appDir: string): MaturityReport {
  const routes: RouteMaturityInfo[] = [];
  walk(root, appDir, '', routes);

  const summary: Record<MaturityLevel, number> = { new: 0, developing: 0, stable: 0, mature: 0 };
  for (const r of routes) summary[r.maturityLevel]++;

  return { routes, summary };
}

export function formatMaturityReport(report: MaturityReport): string {
  const lines: string[] = ['Route Maturity Report', '='.repeat(40)];
  const icons: Record<MaturityLevel, string> = { new: '🌱', developing: '🌿', stable: '🌳', mature: '🏆' };

  for (const r of report.routes) {
    lines.push(`${icons[r.maturityLevel]} ${r.path.padEnd(40)} ${r.maturityLevel} (${r.ageInDays}d)`);
  }

  lines.push('', 'Summary:');
  for (const [level, count] of Object.entries(report.summary)) {
    if (count > 0) lines.push(`  ${icons[level as MaturityLevel]} ${level}: ${count}`);
  }

  return lines.join('\n');
}
