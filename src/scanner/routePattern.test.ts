import { describe, it, expect } from "vitest";
import { analyzePatterns, formatPatternReport, PatternReport } from "./routePattern";
import { RouteNode } from "./routeScanner";

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, hasPage: true, hasLayout: false, isGroup: false, isDynamic: false };
}

describe("analyzePatterns", () => {
  it("returns empty report for static routes", () => {
    const root = makeNode("", [
      makeNode("about"),
      makeNode("contact"),
    ]);
    const report = analyzePatterns(root);
    expect(report.total).toBe(0);
    expect(report.matches).toHaveLength(0);
  });

  it("detects a simple dynamic segment", () => {
    const root = makeNode("", [
      makeNode("blog", [makeNode("[slug]")]),
    ]);
    const report = analyzePatterns(root);
    expect(report.total).toBe(1);
    expect(report.matches[0].params).toContain("slug");
    expect(report.matches[0].isCatchAll).toBe(false);
    expect(report.matches[0].isOptional).toBe(false);
  });

  it("detects catch-all segment", () => {
    const root = makeNode("", [
      makeNode("docs", [makeNode("[...slug]")]),
    ]);
    const report = analyzePatterns(root);
    expect(report.catchAllCount).toBe(1);
    expect(report.matches[0].isCatchAll).toBe(true);
    expect(report.matches[0].params).toContain("slug");
  });

  it("detects optional catch-all segment", () => {
    const root = makeNode("", [
      makeNode("shop", [makeNode("[[...category]]")]),
    ]);
    const report = analyzePatterns(root);
    expect(report.optionalCount).toBe(1);
    expect(report.matches[0].isOptional).toBe(true);
    expect(report.matches[0].isCatchAll).toBe(true);
  });

  it("counts multiple patterns across tree", () => {
    const root = makeNode("", [
      makeNode("users", [makeNode("[id]", [makeNode("posts", [makeNode("[postId]")])])]),
      makeNode("docs", [makeNode("[...path]")]),
    ]);
    const report = analyzePatterns(root);
    expect(report.total).toBe(3);
    expect(report.dynamicCount).toBe(3);
    expect(report.catchAllCount).toBe(1);
  });
});

describe("formatPatternReport", () => {
  it("returns message when no patterns found", () => {
    const report: PatternReport = { matches: [], total: 0, dynamicCount: 0, catchAllCount: 0, optionalCount: 0 };
    expect(formatPatternReport(report)).toContain("No dynamic route patterns");
  });

  it("includes path and pattern in output", () => {
    const root = makeNode("", [
      makeNode("users", [makeNode("[id]")]),
    ]);
    const report = analyzePatterns(root);
    const output = formatPatternReport(report);
    expect(output).toContain("/users/[id]");
    expect(output).toContain(":id");
  });

  it("marks catch-all in output", () => {
    const root = makeNode("", [
      makeNode("docs", [makeNode("[...slug]")]),
    ]);
    const report = analyzePatterns(root);
    const output = formatPatternReport(report);
    expect(output).toContain("catch-all");
  });
});
