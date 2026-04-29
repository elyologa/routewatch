import { RouteNode } from "../scanner/routeScanner";

export interface PatternMatch {
  path: string;
  pattern: string;
  params: string[];
  isOptional: boolean;
  isCatchAll: boolean;
}

export interface PatternReport {
  matches: PatternMatch[];
  total: number;
  dynamicCount: number;
  catchAllCount: number;
  optionalCount: number;
}

function buildPath(node: RouteNode, parent = ""): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function extractParams(segment: string): string[] {
  const params: string[] = [];
  const re = /\[+\.{0,3}([^\]]+)\]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(segment)) !== null) {
    params.push(m[1]);
  }
  return params;
}

function matchSegmentPattern(segment: string): { pattern: string; params: string[]; isOptional: boolean; isCatchAll: boolean } {
  const isCatchAll = /\[\.\.\./.test(segment);
  const isOptional = /\[\[/.test(segment);
  const params = extractParams(segment);
  let pattern = segment
    .replace(/\[\[\.\.\.([^\]]+)\]\]/g, ":$1*?")
    .replace(/\[\.\.\.([^\]]+)\]/g, ":$1*")
    .replace(/\[([^\]]+)\]/g, ":$1");
  return { pattern, params, isOptional, isCatchAll };
}

function walk(node: RouteNode, parentPath: string, results: PatternMatch[]): void {
  const currentPath = buildPath(node, parentPath === "/" ? "" : parentPath);
  const { pattern, params, isOptional, isCatchAll } = matchSegmentPattern(node.segment);
  const hasParam = params.length > 0;

  if (hasParam || isCatchAll || isOptional) {
    results.push({
      path: currentPath,
      pattern,
      params,
      isOptional,
      isCatchAll,
    });
  }

  for (const child of node.children) {
    walk(child, currentPath, results);
  }
}

export function analyzePatterns(root: RouteNode): PatternReport {
  const matches: PatternMatch[] = [];
  for (const child of root.children) {
    walk(child, "/", matches);
  }
  return {
    matches,
    total: matches.length,
    dynamicCount: matches.filter((m) => m.params.length > 0).length,
    catchAllCount: matches.filter((m) => m.isCatchAll).length,
    optionalCount: matches.filter((m) => m.isOptional).length,
  };
}

export function formatPatternReport(report: PatternReport): string {
  if (report.total === 0) return "No dynamic route patterns found.\n";
  const lines: string[] = [
    `Dynamic Route Patterns (${report.total} found)`,
    `  Dynamic: ${report.dynamicCount}  CatchAll: ${report.catchAllCount}  Optional: ${report.optionalCount}`,
    "",
  ];
  for (const m of report.matches) {
    const flags = [m.isCatchAll && "catch-all", m.isOptional && "optional"]
      .filter(Boolean)
      .join(", ");
    const paramStr = m.params.length ? `[${m.params.join(", ")}]` : "";
    lines.push(`  ${m.path}  →  ${m.pattern}  ${paramStr}${flags ? `  (${flags})` : ""}`);
  }
  return lines.join("\n") + "\n";
}
