import * as path from 'path';
import { RouteNode } from '../scanner/routeScanner';

export interface OrphanRoute {
  routePath: string;
  segment: string;
  reason: string;
}

export interface OrphanReport {
  orphans: OrphanRoute[];
  total: number;
  scannedAt: Date;
}

function buildPath(node: RouteNode, parent: string): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function isGroupSegment(segment: string): boolean {
  return segment.startsWith('(') && segment.endsWith(')');
}

function isPrivateSegment(segment: string): boolean {
  return segment.startsWith('_');
}

function hasPageFile(node: RouteNode): boolean {
  return !!(
    node.files?.includes('page.tsx') ||
    node.files?.includes('page.ts') ||
    node.files?.includes('page.jsx') ||
    node.files?.includes('page.js')
  );
}

function walk(
  node: RouteNode,
  parentPath: string,
  orphans: OrphanRoute[]
): void {
  const routePath = buildPath(node, parentPath);

  if (!isGroupSegment(node.segment) && !isPrivateSegment(node.segment)) {
    const childrenWithPages = (node.children ?? []).filter(hasPageFile);
    const hasOwnPage = hasPageFile(node);
    const hasChildren = (node.children ?? []).length > 0;

    if (!hasOwnPage && !hasChildren) {
      orphans.push({
        routePath,
        segment: node.segment,
        reason: 'No page file and no children',
      });
    } else if (!hasOwnPage && hasChildren && childrenWithPages.length === 0) {
      orphans.push({
        routePath,
        segment: node.segment,
        reason: 'No page file and no routable children',
      });
    }
  }

  for (const child of node.children ?? []) {
    walk(child, isGroupSegment(node.segment) ? parentPath : routePath, orphans);
  }
}

export function detectOrphans(roots: RouteNode[]): OrphanReport {
  const orphans: OrphanRoute[] = [];
  for (const root of roots) {
    walk(root, '', orphans);
  }
  return { orphans, total: orphans.length, scannedAt: new Date() };
}

export function formatOrphanReport(report: OrphanReport): string {
  if (report.total === 0) {
    return '\x1b[32m✔ No orphan routes detected.\x1b[0m\n';
  }
  const lines: string[] = [
    `\x1b[33m⚠ ${report.total} orphan route(s) detected:\x1b[0m`,
  ];
  for (const o of report.orphans) {
    lines.push(`  \x1b[31m${o.routePath}\x1b[0m  — ${o.reason}`);
  }
  return lines.join('\n') + '\n';
}
