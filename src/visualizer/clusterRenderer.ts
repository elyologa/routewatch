import { ClusterReport, RouteCluster } from '../scanner/routeCluster';

function bar(size: number, max: number, width = 20): string {
  const filled = Math.round((size / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`;
}

export function renderCluster(cluster: RouteCluster, max: number): string {
  const b = bar(cluster.size, max);
  const label = colorize(cluster.label.padEnd(30), 36);
  const count = colorize(String(cluster.size).padStart(3), 33);
  return `  ${label} ${b} ${count}`;
}

export function buildClusterSummary(report: ClusterReport): string {
  const lines = [
    colorize(
      `Clusters: ${report.totalClusters}  Routes: ${report.totalRoutes}`,
      32
    ),
  ];
  const avg = (report.totalRoutes / Math.max(report.totalClusters, 1)).toFixed(
    1
  );
  lines.push(colorize(`Avg routes per cluster: ${avg}`, 90));
  return lines.join('\n');
}

export function renderClusterReport(report: ClusterReport): string {
  const lines: string[] = [
    colorize('=== Route Cluster Report ===', 1),
    '',
  ];
  const max = Math.max(...report.clusters.map((c) => c.size), 1);
  for (const cluster of report.clusters) {
    lines.push(renderCluster(cluster, max));
  }
  lines.push('');
  lines.push(buildClusterSummary(report));
  return lines.join('\n');
}
