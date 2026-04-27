import * as fs from 'fs';
import * as path from 'path';
import type { RouteNode } from '../scanner/routeScanner';

export interface OwnershipRule {
  pattern: string;
  owner: string;
  team?: string;
}

export interface RouteOwnership {
  route: string;
  owner: string;
  team?: string;
}

export interface OwnershipReport {
  routes: RouteOwnership[];
  unowned: string[];
  byOwner: Record<string, string[]>;
}

export function buildPath(node: RouteNode, parent = ''): string {
  const segment = node.segment === 'root' ? '' : `/${node.segment}`;
  return parent + segment;
}

export function matchesPattern(route: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(route);
}

export function resolveOwner(
  route: string,
  rules: OwnershipRule[]
): OwnershipRule | undefined {
  return rules.find(r => matchesPattern(route, r.pattern));
}

export function walk(
  node: RouteNode,
  rules: OwnershipRule[],
  results: RouteOwnership[],
  unowned: string[],
  parentPath = ''
): void {
  const current = buildPath(node, parentPath);
  if (current) {
    const rule = resolveOwner(current, rules);
    if (rule) {
      results.push({ route: current, owner: rule.owner, team: rule.team });
    } else {
      unowned.push(current);
    }
  }
  for (const child of node.children ?? []) {
    walk(child, rules, results, unowned, current);
  }
}

export function collectOwnership(
  root: RouteNode,
  rules: OwnershipRule[]
): OwnershipReport {
  const routes: RouteOwnership[] = [];
  const unowned: string[] = [];
  walk(root, rules, routes, unowned);
  const byOwner: Record<string, string[]> = {};
  for (const r of routes) {
    (byOwner[r.owner] ??= []).push(r.route);
  }
  return { routes, unowned, byOwner };
}

export function formatOwnershipReport(report: OwnershipReport): string {
  const lines: string[] = ['Route Ownership Report', '======================', ''];
  for (const [owner, owned] of Object.entries(report.byOwner)) {
    lines.push(`Owner: ${owner}`);
    for (const r of owned) lines.push(`  ${r}`);
    lines.push('');
  }
  if (report.unowned.length) {
    lines.push('Unowned Routes:');
    for (const r of report.unowned) lines.push(`  ${r}`);
  }
  return lines.join('\n');
}
