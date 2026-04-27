import { RouteNode } from '../scanner/routeScanner';

export interface VersionedRoute {
  path: string;
  version: string | null;
  versionSource: 'segment' | 'query' | 'header' | 'none';
  isVersioned: boolean;
}

export interface VersionReport {
  routes: VersionedRoute[];
  versions: string[];
  unversioned: string[];
  summary: { total: number; versioned: number; unversioned: number };
}

const VERSION_SEGMENT_RE = /^v(\d+)$/i;
const VERSION_PREFIX_RE = /^\/v(\d+)\//;

export function buildPath(node: RouteNode, parent = ''): string {
  const segment = node.segment === '' ? '' : `/${node.segment}`;
  return parent + segment;
}

export function detectVersionFromSegment(segment: string): string | null {
  const match = segment.match(VERSION_SEGMENT_RE);
  return match ? match[0].toLowerCase() : null;
}

export function walk(
  node: RouteNode,
  parent: string,
  results: VersionedRoute[]
): void {
  const path = buildPath(node, parent);
  const segmentVersion = detectVersionFromSegment(node.segment);
  const pathVersion = path.match(VERSION_PREFIX_RE)?.[1]
    ? `v${path.match(VERSION_PREFIX_RE)![1]}`
    : null;

  const version = segmentVersion ?? pathVersion ?? null;
  const versionSource: VersionedRoute['versionSource'] = segmentVersion
    ? 'segment'
    : pathVersion
    ? 'segment'
    : 'none';

  if (node.hasPage || node.hasLayout) {
    results.push({
      path: path || '/',
      version,
      versionSource,
      isVersioned: version !== null,
    });
  }

  for (const child of node.children ?? []) {
    walk(child, path, results);
  }
}

export function versionRoutes(root: RouteNode): VersionReport {
  const results: VersionedRoute[] = [];
  walk(root, '', results);

  const versioned = results.filter((r) => r.isVersioned);
  const unversioned = results.filter((r) => !r.isVersioned);
  const versions = [...new Set(versioned.map((r) => r.version as string))].sort();

  return {
    routes: results,
    versions,
    unversioned: unversioned.map((r) => r.path),
    summary: {
      total: results.length,
      versioned: versioned.length,
      unversioned: unversioned.length,
    },
  };
}

export function formatVersionReport(report: VersionReport): string {
  const lines: string[] = [];
  lines.push(`Route Versioning Report`);
  lines.push(`=======================`);
  lines.push(
    `Total: ${report.summary.total} | Versioned: ${report.summary.versioned} | Unversioned: ${report.summary.unversioned}`
  );

  if (report.versions.length > 0) {
    lines.push(`\nDetected versions: ${report.versions.join(', ')}`);
    for (const v of report.versions) {
      const group = report.routes.filter((r) => r.version === v);
      lines.push(`\n[${v}]`);
      for (const r of group) lines.push(`  ${r.path}`);
    }
  }

  if (report.unversioned.length > 0) {
    lines.push(`\n[unversioned]`);
    for (const p of report.unversioned) lines.push(`  ${p}`);
  }

  return lines.join('\n');
}
