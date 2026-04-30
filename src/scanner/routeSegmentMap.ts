import { RouteNode } from "../scanner/routeScanner";

export interface SegmentEntry {
  segment: string;
  paths: string[];
  count: number;
  isDynamic: boolean;
  isCatchAll: boolean;
  isGroup: boolean;
}

export interface SegmentMapReport {
  segments: SegmentEntry[];
  totalUnique: number;
  mostUsed: SegmentEntry | null;
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

function isGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

function walk(
  node: RouteNode,
  map: Map<string, SegmentEntry>,
  parentPath = ""
): void {
  const currentPath = buildPath(node, parentPath);
  const seg = node.segment;

  if (!map.has(seg)) {
    map.set(seg, {
      segment: seg,
      paths: [],
      count: 0,
      isDynamic: isDynamic(seg),
      isCatchAll: isCatchAll(seg),
      isGroup: isGroup(seg),
    });
  }

  const entry = map.get(seg)!;
  entry.paths.push(currentPath);
  entry.count += 1;

  for (const child of node.children ?? []) {
    walk(child, map, currentPath);
  }
}

export function buildSegmentMap(roots: RouteNode[]): SegmentMapReport {
  const map = new Map<string, SegmentEntry>();

  for (const root of roots) {
    walk(root, map);
  }

  const segments = Array.from(map.values()).sort((a, b) => b.count - a.count);
  const mostUsed = segments.length > 0 ? segments[0] : null;

  return {
    segments,
    totalUnique: segments.length,
    mostUsed,
  };
}

export function formatSegmentMap(report: SegmentMapReport): string {
  const lines: string[] = [
    `Segment Map — ${report.totalUnique} unique segment(s)`,
    "",
  ];

  for (const entry of report.segments) {
    const tags: string[] = [];
    if (entry.isDynamic) tags.push("dynamic");
    if (entry.isCatchAll) tags.push("catch-all");
    if (entry.isGroup) tags.push("group");
    const tagStr = tags.length > 0 ? ` [${tags.join(", ")}]` : "";
    lines.push(`  ${entry.segment}${tagStr} — used ${entry.count}x`);
    for (const p of entry.paths) {
      lines.push(`    ${p}`);
    }
  }

  if (report.mostUsed) {
    lines.push("");
    lines.push(`Most used segment: "${report.mostUsed.segment}" (${report.mostUsed.count}x)`);
  }

  return lines.join("\n");
}
