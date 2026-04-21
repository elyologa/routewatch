import { describe, it, expect } from "vitest";
import {
  auditAccessibility,
  formatAccessibilityReport,
} from "./routeAccessibility";
import { RouteNode } from "./routeScanner";

function makeNode(
  segment: string,
  children: RouteNode[] = []
): RouteNode {
  return { segment, children, hasPage: true };
}

describe("auditAccessibility", () => {
  it("returns no issues for a simple static route tree", () => {
    const root = makeNode("", [
      makeNode("about"),
      makeNode("contact"),
    ]);
    const report = auditAccessibility(root);
    expect(report.issues).toHaveLength(0);
    expect(report.affectedRoutes).toBe(0);
  });

  it("flags dynamic segments with a warning", () => {
    const root = makeNode("", [makeNode("[id]")]);
    const report = auditAccessibility(root);
    const dynamic = report.issues.filter((i) => i.type === "dynamic-unlabeled");
    expect(dynamic).toHaveLength(1);
    expect(dynamic[0].severity).toBe("warning");
    expect(dynamic[0].path).toBe("/[id]");
  });

  it("flags catch-all segments with an error", () => {
    const root = makeNode("", [makeNode("[...slug]")]);
    const report = auditAccessibility(root);
    const catchAll = report.issues.filter((i) => i.type === "catch-all-unlabeled");
    expect(catchAll).toHaveLength(1);
    expect(catchAll[0].severity).toBe("error");
  });

  it("flags routes nested more than 5 levels deep", () => {
    const deep = makeNode("f", [makeNode("g")]);
    const root = makeNode("", [
      makeNode("a", [makeNode("b", [makeNode("c", [makeNode("d", [makeNode("e", [deep])])])])]),
    ]);
    const report = auditAccessibility(root);
    const nesting = report.issues.filter((i) => i.type === "deep-nesting");
    expect(nesting.length).toBeGreaterThan(0);
  });

  it("counts total routes correctly", () => {
    const root = makeNode("", [makeNode("a"), makeNode("b", [makeNode("c")])]);
    const report = auditAccessibility(root);
    expect(report.totalRoutes).toBe(4);
  });
});

describe("formatAccessibilityReport", () => {
  it("shows a clean message when no issues exist", () => {
    const report = { issues: [], totalRoutes: 3, affectedRoutes: 0 };
    const output = formatAccessibilityReport(report);
    expect(output).toContain("No accessibility issues found");
  });

  it("renders issue lines with icons", () => {
    const report = {
      issues: [
        { path: "/[id]", type: "dynamic-unlabeled" as const, message: "label it", severity: "warning" as const },
        { path: "/[...s]", type: "catch-all-unlabeled" as const, message: "check it", severity: "error" as const },
      ],
      totalRoutes: 3,
      affectedRoutes: 2,
    };
    const output = formatAccessibilityReport(report);
    expect(output).toContain("⚠");
    expect(output).toContain("✖");
    expect(output).toContain("/[id]");
  });
});
