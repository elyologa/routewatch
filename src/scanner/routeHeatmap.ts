import { RouteNode } from "../scanner/routeScanner";

export interface RouteHeatEntry {
  path: string;
  depth: number;
  dynamicSegments: number;
  catchAll: boolean;
  score: number;
}

export interface HeatmapReport {
  entries: RouteHeatEntry[];
  hottest: RouteHeatEntry | null;
  coldest: RouteHeatEntry | null;
  average: number;
}

function buildPath(node: RouteNode, parent = ""): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function isDynamic(segment: string): boolean {
  return segment.startsWith("[") && !segment.startsWith("[...");
}

function isCatchAll(segment: string): boolean {
  return segment.startsWith("[...");
}

function computeScore(entry: Omit<RouteHeatEntry, "score">): number {
  return entry.depth * 2 + entry.dynamicSegments * 3 + (entry.catchAll ? 5 : 0);
}

function walk(node: RouteNode, parentPath: string, entries: RouteHeatEntry[]): void {
  const path = buildPath(node, parentPath);
  const segments = path.split("/").filter(Boolean);
  const dynamicSegments = segments.filter(isDynamic).length;
  const catchAll = segments.some(isCatchAll);
  const depth = segments.length;

  const base = { path, depth, dynamicSegments, catchAll };
  entries.push({ ...base, score: computeScore(base) });

  for (const child of node.children ?? []) {
    walk(child, path, entries);
  }
}

export function buildHeatmap(root: RouteNode): HeatmapReport {
  const entries: RouteHeatEntry[] = [];
  walk(root, "", entries);

  if (entries.length === 0) {
    return { entries, hottest: null, coldest: null, average: 0 };
  }

  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const average = entries.reduce((sum, e) => sum + e.score, 0) / entries.length;

  return {
    entries,
    hottest: sorted[0],
    coldest: sorted[sorted.length - 1],
    average: Math.round(average * 100) / 100,
  };
}

export function formatHeatmap(report: HeatmapReport): string {
  const lines: string[] = ["Route Heatmap", "============="];

  for (const entry of report.entries.sort((a, b) => b.score - a.score)) {
    const bar = "█".repeat(Math.min(entry.score, 20));
    lines.push(`  ${entry.path.padEnd(40)} score=${entry.score} ${bar}`);
  }

  lines.push("");
  lines.push(`  Hottest : ${report.hottest?.path ?? "n/a"} (score=${report.hottest?.score ?? 0})`);
  lines.push(`  Coldest : ${report.coldest?.path ?? "n/a"} (score=${report.coldest?.score ?? 0})`);
  lines.push(`  Average : ${report.average}`);

  return lines.join("\n");
}
