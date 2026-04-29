import { RouteNode } from '../scanner/routeScanner';

export interface RouteCluster {
  label: string;
  routes: string[];
  size: number;
}

export interface ClusterReport {
  clusters: RouteCluster[];
  totalRoutes: number;
  totalClusters: number;
}

export function buildPath(node: RouteNode, parent = ''): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

export function collectPaths(node: RouteNode, parent = ''): string[] {
  const current = buildPath(node, parent);
  const paths: string[] = [current];
  for (const child of node.children ?? []) {
    paths.push(...collectPaths(child, current));
  }
  return paths;
}

export function extractPrefix(path: string, depth: number): string {
  const parts = path.split('/').filter(Boolean);
  return '/' + parts.slice(0, depth).join('/');
}

export function clusterRoutes(
  node: RouteNode,
  depth = 1
): ClusterReport {
  const paths = collectPaths(node);
  const map = new Map<string, string[]>();

  for (const p of paths) {
    const prefix = extractPrefix(p, depth) || '/';
    if (!map.has(prefix)) map.set(prefix, []);
    map.get(prefix)!.push(p);
  }

  const clusters: RouteCluster[] = Array.from(map.entries()).map(
    ([label, routes]) => ({ label, routes, size: routes.length })
  );

  clusters.sort((a, b) => b.size - a.size);

  return {
    clusters,
    totalRoutes: paths.length,
    totalClusters: clusters.length,
  };
}

export function formatClusterReport(report: ClusterReport): string {
  const lines: string[] = [
    `Route Clusters (${report.totalClusters} clusters, ${report.totalRoutes} routes)`,
    '',
  ];
  for (const cluster of report.clusters) {
    lines.push(`  ${cluster.label}  (${cluster.size} routes)`);
    for (const r of cluster.routes) {
      lines.push(`    - ${r}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
