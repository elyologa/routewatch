import type { RouteNode } from '../scanner/routeScanner';
import type { DeadRouteReport } from '../analyzer/deadRouteAnalyzer';
import { colorize } from '../reporter/reportFormatter';

export interface SummaryStats {
  totalRoutes: number;
  deadRoutes: number;
  dynamicRoutes: number;
  groupRoutes: number;
  coveragePercent: number;
}

export function computeStats(
  nodes: RouteNode[],
  report: DeadRouteReport
): SummaryStats {
  let total = 0;
  let dynamic = 0;
  let group = 0;

  function walk(node: RouteNode): void {
    total++;
    if (node.isDynamic) dynamic++;
    if (node.isGroup) group++;
    node.children.forEach(walk);
  }

  nodes.forEach(walk);

  const dead = report.deadRoutes.length;
  const coveragePercent = total > 0 ? Math.round(((total - dead) / total) * 100) : 100;

  return { totalRoutes: total, deadRoutes: dead, dynamicRoutes: dynamic, groupRoutes: group, coveragePercent };
}

export function renderSummary(stats: SummaryStats): string {
  const lines: string[] = [];

  lines.push(colorize('bold', '\n── Route Summary ──────────────────'));
  lines.push(`  Total routes   : ${colorize('cyan', String(stats.totalRoutes))}`);
  lines.push(`  Dynamic routes : ${colorize('cyan', String(stats.dynamicRoutes))}`);
  lines.push(`  Group segments : ${colorize('cyan', String(stats.groupRoutes))}`);

  const deadColor = stats.deadRoutes > 0 ? 'red' : 'green';
  lines.push(`  Dead routes    : ${colorize(deadColor, String(stats.deadRoutes))}`);

  const covColor = stats.coveragePercent >= 80 ? 'green' : stats.coveragePercent >= 50 ? 'yellow' : 'red';
  lines.push(`  Coverage       : ${colorize(covColor, stats.coveragePercent + '%')}`);
  lines.push(colorize('bold', '────────────────────────────────────'));

  return lines.join('\n');
}
