import * as fs from 'fs';
import * as path from 'path';
import type { RouteNode } from '../scanner/routeScanner';

export interface TimelineEntry {
  route: string;
  createdAt: Date | null;
  modifiedAt: Date | null;
  ageInDays: number | null;
}

export interface TimelineReport {
  entries: TimelineEntry[];
  oldest: TimelineEntry | null;
  newest: TimelineEntry | null;
  averageAgeInDays: number | null;
}

function buildPath(node: RouteNode, parent = ''): string {
  const segment = node.segment === 'root' ? '' : `/${node.segment}`;
  return `${parent}${segment}` || '/';
}

function getFileStat(filePath: string): { createdAt: Date | null; modifiedAt: Date | null } {
  try {
    const stat = fs.statSync(filePath);
    return { createdAt: stat.birthtime, modifiedAt: stat.mtime };
  } catch {
    return { createdAt: null, modifiedAt: null };
  }
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function walk(node: RouteNode, appDir: string, parentPath: string, entries: TimelineEntry[]): void {
  const routePath = buildPath(node, parentPath);
  const fsPath = path.join(appDir, routePath === '/' ? '' : routePath);
  const pageFile = ['page.tsx', 'page.ts', 'page.jsx', 'page.js']
    .map(f => path.join(fsPath, f))
    .find(f => fs.existsSync(f)) ?? null;

  const { createdAt, modifiedAt } = pageFile ? getFileStat(pageFile) : { createdAt: null, modifiedAt: null };
  const ageInDays = createdAt ? daysBetween(createdAt, new Date()) : null;
  entries.push({ route: routePath, createdAt, modifiedAt, ageInDays });

  for (const child of node.children ?? []) {
    walk(child, appDir, routePath === '/' ? '' : routePath, entries);
  }
}

export function collectTimeline(root: RouteNode, appDir: string): TimelineReport {
  const entries: TimelineEntry[] = [];
  walk(root, appDir, '', entries);

  const dated = entries.filter(e => e.ageInDays !== null);
  const oldest = dated.reduce<TimelineEntry | null>((acc, e) => {
    if (!acc || (e.ageInDays ?? 0) > (acc.ageInDays ?? 0)) return e;
    return acc;
  }, null);
  const newest = dated.reduce<TimelineEntry | null>((acc, e) => {
    if (!acc || (e.ageInDays ?? Infinity) < (acc.ageInDays ?? Infinity)) return e;
    return acc;
  }, null);
  const averageAgeInDays = dated.length
    ? Math.round(dated.reduce((sum, e) => sum + (e.ageInDays ?? 0), 0) / dated.length)
    : null;

  return { entries, oldest, newest, averageAgeInDays };
}

export function formatTimeline(report: TimelineReport): string {
  const lines: string[] = ['Route Timeline Report', '====================='];
  for (const entry of report.entries) {
    const age = entry.ageInDays !== null ? `${entry.ageInDays}d old` : 'unknown age';
    const mod = entry.modifiedAt ? entry.modifiedAt.toISOString().split('T')[0] : 'n/a';
    lines.push(`  ${entry.route.padEnd(40)} age: ${age.padEnd(12)} last modified: ${mod}`);
  }
  lines.push('');
  if (report.oldest) lines.push(`Oldest route : ${report.oldest.route} (${report.oldest.ageInDays}d)`);
  if (report.newest) lines.push(`Newest route : ${report.newest.route} (${report.newest.ageInDays}d)`);
  if (report.averageAgeInDays !== null) lines.push(`Average age  : ${report.averageAgeInDays}d`);
  return lines.join('\n');
}
