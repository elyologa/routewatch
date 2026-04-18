import type { RouteNode } from '../scanner/routeScanner';
import type { DeadRouteReport } from '../analyzer/deadRouteAnalyzer';
import { renderTree, RenderOptions } from './treeRenderer';

export interface VisualizeOptions {
  useColor?: boolean;
  showDead?: boolean;
}

export function visualize(
  roots: RouteNode[],
  report: DeadRouteReport,
  options: VisualizeOptions = {}
): string {
  const { useColor = true, showDead = true } = options;

  const deadSet = showDead
    ? new Set(report.deadRoutes.map((r) => r.path))
    : new Set<string>();

  const renderOpts: RenderOptions = { deadRoutes: deadSet, useColor };
  const tree = renderTree(roots, renderOpts);

  const summary = buildSummary(report, useColor);
  return `${tree}\n\n${summary}`;
}

function buildSummary(report: DeadRouteReport, useColor: boolean): string {
  const total = report.totalRoutes;
  const dead  = report.deadRoutes.length;
  const live  = total - dead;

  const fmt = (n: number, color: string) =>
    useColor ? `${color}${n}\x1b[0m` : String(n);

  const lines = [
    `Total routes : ${fmt(total, '\x1b[37m')}`,
    `Live routes  : ${fmt(live,  '\x1b[32m')}`,
    `Dead routes  : ${fmt(dead,  dead > 0 ? '\x1b[31m' : '\x1b[32m')}`,
  ];

  return lines.join('\n');
}
