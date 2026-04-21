import { RouteNode } from "../scanner/routeScanner";

export interface AccessibilityIssue {
  path: string;
  type: "missing-aria" | "dynamic-unlabeled" | "catch-all-unlabeled" | "deep-nesting";
  message: string;
  severity: "warning" | "error";
}

export interface AccessibilityReport {
  issues: AccessibilityIssue[];
  totalRoutes: number;
  affectedRoutes: number;
}

function buildPath(node: RouteNode, parent = ""): string {
  const segment = node.segment === "" ? "" : `/${node.segment}`;
  return `${parent}${segment}` || "/";
}

function isDynamic(segment: string): boolean {
  return segment.startsWith("[") && !segment.startsWith("[...");
}

function isCatchAll(segment: string): boolean {
  return segment.startsWith("[...");
}

function checkNode(
  node: RouteNode,
  parentPath: string,
  issues: AccessibilityIssue[]
): void {
  const path = buildPath(node, parentPath);
  const depth = path.split("/").filter(Boolean).length;

  if (isDynamic(node.segment)) {
    issues.push({
      path,
      type: "dynamic-unlabeled",
      message: `Dynamic segment "${node.segment}" should have a descriptive label or aria-label in its page component.`,
      severity: "warning",
    });
  }

  if (isCatchAll(node.segment)) {
    issues.push({
      path,
      type: "catch-all-unlabeled",
      message: `Catch-all segment "${node.segment}" may render unpredictable content; ensure accessible headings are present.`,
      severity: "error",
    });
  }

  if (depth > 5) {
    issues.push({
      path,
      type: "deep-nesting",
      message: `Route is nested ${depth} levels deep, which may hinder breadcrumb accessibility.`,
      severity: "warning",
    });
  }

  for (const child of node.children ?? []) {
    checkNode(child, path, issues);
  }
}

export function auditAccessibility(root: RouteNode): AccessibilityReport {
  const issues: AccessibilityIssue[] = [];
  checkNode(root, "", issues);
  const affectedRoutes = new Set(issues.map((i) => i.path)).size;
  return { issues, totalRoutes: countRoutes(root), affectedRoutes };
}

function countRoutes(node: RouteNode): number {
  return 1 + (node.children ?? []).reduce((s, c) => s + countRoutes(c), 0);
}

export function formatAccessibilityReport(report: AccessibilityReport): string {
  const lines: string[] = [
    `Accessibility Audit: ${report.affectedRoutes}/${report.totalRoutes} routes affected`,
    "",
  ];
  if (report.issues.length === 0) {
    lines.push("  No accessibility issues found.");
  } else {
    for (const issue of report.issues) {
      const icon = issue.severity === "error" ? "✖" : "⚠";
      lines.push(`  ${icon} [${issue.type}] ${issue.path}`);
      lines.push(`      ${issue.message}`);
    }
  }
  return lines.join("\n");
}
