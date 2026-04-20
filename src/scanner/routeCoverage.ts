import { RouteNode } from "../scanner/routeScanner";

export interface RouteCoverageEntry {
  path: string;
  hasPage: boolean;
  hasLayout: boolean;
  hasLoading: boolean;
  hasError: boolean;
  coverageScore: number;
}

export interface RouteCoverageReport {
  entries: RouteCoverageEntry[];
  totalRoutes: number;
  fullyCovered: number;
  partiallyCovered: number;
  uncovered: number;
  overallScore: number;
}

export function buildPath(node: RouteNode, parent = ""): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

export function computeCoverage(node: RouteNode, parentPath = ""): RouteCoverageEntry {
  const path = buildPath(node, parentPath);
  const hasPage = !!node.hasPage;
  const hasLayout = !!(node.files && node.files.includes("layout"));
  const hasLoading = !!(node.files && node.files.includes("loading"));
  const hasError = !!(node.files && node.files.includes("error"));

  const checks = [hasPage, hasLayout, hasLoading, hasError];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return { path, hasPage, hasLayout, hasLoading, hasError, coverageScore: score };
}

export function walk(
  node: RouteNode,
  parentPath = "",
  entries: RouteCoverageEntry[] = []
): RouteCoverageEntry[] {
  entries.push(computeCoverage(node, parentPath));
  const currentPath = buildPath(node, parentPath);
  for (const child of node.children ?? []) {
    walk(child, currentPath, entries);
  }
  return entries;
}

export function collectCoverage(root: RouteNode): RouteCoverageReport {
  const entries = walk(root);
  const totalRoutes = entries.length;
  const fullyCovered = entries.filter((e) => e.coverageScore === 100).length;
  const uncovered = entries.filter((e) => e.coverageScore === 0).length;
  const partiallyCovered = totalRoutes - fullyCovered - uncovered;
  const overallScore =
    totalRoutes === 0
      ? 0
      : Math.round(entries.reduce((sum, e) => sum + e.coverageScore, 0) / totalRoutes);

  return { entries, totalRoutes, fullyCovered, partiallyCovered, uncovered, overallScore };
}

export function formatCoverageReport(report: RouteCoverageReport): string {
  const lines: string[] = [
    `Route Coverage Report`,
    `─────────────────────`,
    `Total Routes   : ${report.totalRoutes}`,
    `Fully Covered  : ${report.fullyCovered}`,
    `Partial        : ${report.partiallyCovered}`,
    `Uncovered      : ${report.uncovered}`,
    `Overall Score  : ${report.overallScore}%`,
    ``,
    `Details:`,
  ];

  for (const entry of report.entries) {
    const flags = [
      entry.hasPage ? "page" : "-",
      entry.hasLayout ? "layout" : "-",
      entry.hasLoading ? "loading" : "-",
      entry.hasError ? "error" : "-",
    ].join(" ");
    lines.push(`  ${entry.path.padEnd(40)} [${flags}]  ${entry.coverageScore}%`);
  }

  return lines.join("\n");
}
