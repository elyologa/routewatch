import { CircularRef } from "../scanner/routeCircularDetector";

export interface CircularSummary {
  total: number;
  paths: string[];
}

export function buildCircularSummary(refs: CircularRef[]): CircularSummary {
  return {
    total: refs.length,
    paths: refs.map((r) => r.path),
  };
}

export function renderCircularTree(refs: CircularRef[]): string {
  if (refs.length === 0) {
    return "✔ No circular route references detected.";
  }

  const lines: string[] = [`⚠ Circular Route References (${refs.length})`, ""];

  refs.forEach((ref, i) => {
    const connector = i < refs.length - 1 ? "├──" : "└──";
    lines.push(`  ${connector} ${ref.path}`);
    lines.push(`       ${ref.reason}`);
  });

  return lines.join("\n");
}

export function renderCircularSummary(summary: CircularSummary): string {
  if (summary.total === 0) {
    return "Summary: clean — 0 circular references.";
  }
  const pathList = summary.paths.map((p) => `  - ${p}`).join("\n");
  return `Summary: ${summary.total} circular reference(s) found\n${pathList}`;
}
