import { describe, it, expect } from "vitest";
import { optimizeRoutes, formatOptimizationReport } from "./routeOptimizer";
import { RouteNode } from "./routeScanner";

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, hasPage: true, hasLayout: false };
}

describe("optimizeRoutes", () => {
  it("returns score 100 for a clean shallow tree", () => {
    const root = makeNode("", [
      makeNode("about"),
      makeNode("contact"),
    ]);
    const report = optimizeRoutes(root);
    expect(report.score).toBe(100);
    expect(report.hints).toHaveLength(0);
  });

  it("detects deep nesting beyond 5 levels", () => {
    const deep = makeNode("f", [
      makeNode("g"),
    ]);
    const root = makeNode("", [
      makeNode("a", [makeNode("b", [makeNode("c", [makeNode("d", [makeNode("e", [deep])])])])]),
    ]);
    const report = optimizeRoutes(root);
    const deepHints = report.hints.filter((h) => h.type === "deep-nesting");
    expect(deepHints.length).toBeGreaterThan(0);
    expect(report.score).toBeLessThan(100);
  });

  it("detects catch-all conflicting with dynamic segment", () => {
    const root = makeNode("", [
      makeNode("shop", [
        makeNode("[id]"),
        makeNode("[...slug]"),
      ]),
    ]);
    const report = optimizeRoutes(root);
    const conflict = report.hints.find((h) => h.type === "catchall-conflict");
    expect(conflict).toBeDefined();
    expect(conflict?.severity).toBe("error");
  });

  it("score decreases with multiple errors", () => {
    const root = makeNode("", [
      makeNode("a", [makeNode("[id]"), makeNode("[...rest]")]),
      makeNode("b", [makeNode("[id]"), makeNode("[...rest]")]),
    ]);
    const report = optimizeRoutes(root);
    expect(report.score).toBeLessThanOrEqual(60);
  });
});

describe("formatOptimizationReport", () => {
  it("shows score and no issues when clean", () => {
    const output = formatOptimizationReport({ hints: [], score: 100 });
    expect(output).toContain("100/100");
    expect(output).toContain("No issues found.");
  });

  it("lists hints with severity and type", () => {
    const report = {
      score: 80,
      hints: [
        { path: "/a/b", type: "deep-nesting" as const, message: "Too deep", severity: "warning" as const },
      ],
    };
    const output = formatOptimizationReport(report);
    expect(output).toContain("WARNING");
    expect(output).toContain("deep-nesting");
    expect(output).toContain("/a/b");
  });
});
