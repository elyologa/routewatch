import { RouteNode } from "../scanner/routeScanner";

export interface OptimizationHint {
  path: string;
  type: "redundant-group" | "deep-nesting" | "duplicate-segment" | "catchall-conflict";
  message: string;
  severity: "info" | "warning" | "error";
}

export interface OptimizationReport {
  hints: OptimizationHint[];
  score: number;
}

function buildPath(node: RouteNode, parent = ""): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function isDeeplyNested(depth: number): boolean {
  return depth > 5;
}

function hasDuplicateSegment(path: string): boolean {
  const parts = path.split("/").filter(Boolean);
  return parts.length !== new Set(parts).size;
}

function walk(
  node: RouteNode,
  hints: OptimizationHint[],
  parent = "",
  depth = 0
): void {
  const path = buildPath(node, parent);

  if (isDeeplyNested(depth)) {
    hints.push({
      path,
      type: "deep-nesting",
      message: `Route is nested ${depth} levels deep; consider flattening.`,
      severity: "warning",
    });
  }

  if (hasDuplicateSegment(path)) {
    hints.push({
      path,
      type: "duplicate-segment",
      message: `Duplicate segment detected in path "${path}".`,
      severity: "warning",
    });
  }

  const hasCatchAll = node.children.some((c) => c.segment.startsWith("[\.\.\.]") || c.segment.startsWith("[..."));
  const hasOtherDynamic = node.children.some(
    (c) => c.segment.startsWith("[") && !c.segment.startsWith("[...")
  );
  if (hasCatchAll && hasOtherDynamic) {
    hints.push({
      path,
      type: "catchall-conflict",
      message: `Catch-all and dynamic segments coexist under "${path}"; catch-all may shadow other routes.`,
      severity: "error",
    });
  }

  for (const child of node.children) {
    walk(child, hints, path, depth + 1);
  }
}

export function optimizeRoutes(root: RouteNode): OptimizationReport {
  const hints: OptimizationHint[] = [];
  for (const child of root.children) {
    walk(child, hints, "", 1);
  }
  const errorCount = hints.filter((h) => h.severity === "error").length;
  const warnCount = hints.filter((h) => h.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 20 - warnCount * 5);
  return { hints, score };
}

export function formatOptimizationReport(report: OptimizationReport): string {
  const lines: string[] = [];
  lines.push(`Optimization Score: ${report.score}/100`);
  if (report.hints.length === 0) {
    lines.push("No issues found.");
    return lines.join("\n");
  }
  for (const hint of report.hints) {
    const tag = hint.severity.toUpperCase().padEnd(7);
    lines.push(`[${tag}] (${hint.type}) ${hint.path} — ${hint.message}`);
  }
  return lines.join("\n");
}
