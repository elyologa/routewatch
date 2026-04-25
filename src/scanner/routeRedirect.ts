import * as fs from 'fs';
import * as path from 'path';
import { RouteNode } from '../scanner/routeScanner';

export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

export interface RouteRedirectReport {
  redirects: RedirectRule[];
  affectedRoutes: string[];
  summary: string;
}

export function buildPath(node: RouteNode, prefix = ''): string {
  const seg = node.segment === 'root' ? '' : `/${node.segment}`;
  return prefix + seg;
}

export function collectPaths(node: RouteNode, prefix = ''): string[] {
  const current = buildPath(node, prefix);
  const paths: string[] = current ? [current] : [];
  for (const child of node.children ?? []) {
    paths.push(...collectPaths(child, current));
  }
  return paths;
}

export function matchesSource(routePath: string, source: string): boolean {
  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(routePath);
}

export function detectRedirects(
  node: RouteNode,
  rules: RedirectRule[]
): RouteRedirectReport {
  const allPaths = collectPaths(node);
  const affectedRoutes: string[] = [];

  for (const rule of rules) {
    for (const p of allPaths) {
      if (matchesSource(p, rule.source) && !affectedRoutes.includes(p)) {
        affectedRoutes.push(p);
      }
    }
  }

  return {
    redirects: rules,
    affectedRoutes,
    summary: `${rules.length} redirect rule(s) affecting ${affectedRoutes.length} route(s)`,
  };
}

export function formatRedirectReport(report: RouteRedirectReport): string {
  const lines: string[] = [`Redirect Report`, `===============`, report.summary, ''];
  if (report.redirects.length === 0) {
    lines.push('No redirect rules defined.');
    return lines.join('\n');
  }
  for (const r of report.redirects) {
    const type = r.permanent ? '301' : '302';
    const affected = report.affectedRoutes.filter(p => matchesSource(p, r.source));
    lines.push(`[${type}] ${r.source} → ${r.destination}`);
    if (affected.length > 0) {
      lines.push(`  Matches: ${affected.join(', ')}`);
    } else {
      lines.push(`  Matches: (none)`);
    }
  }
  return lines.join('\n');
}
