import * as fs from 'fs';
import * as path from 'path';
import type { RouteNode } from '../scanner/routeScanner';

export interface TrendEntry {
  route: string;
  addedAt: Date;
  modifiedAt: Date;
  ageInDays: number;
  growthRate: number; // children added per day since creation
}

export interface TrendReport {
  entries: TrendEntry[];
  fastestGrowing: TrendEntry[];
  newest: TrendEntry[];
  oldest: TrendEntry[];
  averageAgeInDays: number;
}

function buildPath(node: RouteNode, parent = ''): string {
  const segment = node.segment === '' ? '' : `/${node.segment}`;
  return parent + segment || '/';
}

function getFileStat(dir: string): { created: Date; modified: Date } | null {
  try {
    const stat = fs.statSync(dir);
    return { created: stat.birthtime, modified: stat.mtime };
  } catch {
    return null;
  }
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86_400_000));
}

function walk(node: RouteNode, parentPath: string, now: Date, entries: TrendEntry[]): void {
  const routePath = buildPath(node, parentPath);
  const stat = node.dir ? getFileStat(node.dir) : null;

  if (stat) {
    const ageInDays = daysBetween(stat.created, now);
    const daysSinceCreation = Math.max(1, ageInDays);
    const growthRate = node.children.length / daysSinceCreation;

    entries.push({
      route: routePath,
      addedAt: stat.created,
      modifiedAt: stat.modified,
      ageInDays,
      growthRate,
    });
  }

  for (const child of node.children) {
    walk(child, routePath, now, entries);
  }
}

export function analyzeTrend(root: RouteNode): TrendReport {
  const now = new Date();
  const entries: TrendEntry[] = [];
  walk(root, '', now, entries);

  const sorted = [...entries].sort((a, b) => a.ageInDays - b.ageInDays);
  const totalAge = entries.reduce((s, e) => s + e.ageInDays, 0);
  const averageAgeInDays = entries.length ? Math.round(totalAge / entries.length) : 0;

  return {
    entries,
    fastestGrowing: [...entries].sort((a, b) => b.growthRate - a.growthRate).slice(0, 5),
    newest: sorted.slice(0, 5),
    oldest: [...sorted].reverse().slice(0, 5),
    averageAgeInDays,
  };
}

export function formatTrendReport(report: TrendReport): string {
  const lines: string[] = ['Route Trend Analysis', '='.repeat(40)];
  lines.push(`Average route age: ${report.averageAgeInDays} days`);
  lines.push(`Total routes tracked: ${report.entries.length}`);

  lines.push('\nFastest Growing:');
  for (const e of report.fastestGrowing) {
    lines.push(`  ${e.route}  (${e.growthRate.toFixed(3)} children/day)`);
  }

  lines.push('\nNewest Routes:');
  for (const e of report.newest) {
    lines.push(`  ${e.route}  (${e.ageInDays}d old)`);
  }

  lines.push('\nOldest Routes:');
  for (const e of report.oldest) {
    lines.push(`  ${e.route}  (${e.ageInDays}d old)`);
  }

  return lines.join('\n');
}
