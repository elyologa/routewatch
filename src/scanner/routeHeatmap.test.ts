import { describe, it, expect } from "vitest";
import { buildHeatmap, formatHeatmap, RouteHeatEntry } from "./routeHeatmap";
import { RouteNode } from "./routeScanner";

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, path: segment };
}

describe("buildHeatmap", () => {
  it("returns empty report for a leaf node", () => {
    const root = makeNode("dashboard");
    const report = buildHeatmap(root);
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0].path).toBe("/dashboard");
    expect(report.entries[0].depth).toBe(1);
    expect(report.entries[0].dynamicSegments).toBe(0);
    expect(report.entries[0].catchAll).toBe(false);
  });

  it("scores dynamic segments higher", () => {
    const root = makeNode("users", [makeNode("[id]")]);
    const report = buildHeatmap(root);
    const dynamic = report.entries.find((e) => e.path.includes("[id]"));
    const staticRoute = report.entries.find((e) => e.path === "/users");
    expect(dynamic).toBeDefined();
    expect(dynamic!.dynamicSegments).toBe(1);
    expect(dynamic!.score).toBeGreaterThan(staticRoute!.score);
  });

  it("scores catch-all segments highest", () => {
    const root = makeNode("docs", [makeNode("[...slug]")]);
    const report = buildHeatmap(root);
    const catchAll = report.entries.find((e) => e.catchAll);
    expect(catchAll).toBeDefined();
    expect(catchAll!.score).toBeGreaterThanOrEqual(7);
  });

  it("identifies hottest and coldest routes", () => {
    const root = makeNode("app", [
      makeNode("home"),
      makeNode("[...all]"),
    ]);
    const report = buildHeatmap(root);
    expect(report.hottest?.catchAll).toBe(true);
    expect(report.coldest?.score).toBeLessThanOrEqual(report.hottest!.score);
  });

  it("computes average score", () => {
    const root = makeNode("a", [makeNode("b")]);
    const report = buildHeatmap(root);
    const expected = (report.entries[0].score + report.entries[1].score) / 2;
    expect(report.average).toBeCloseTo(expected, 2);
  });
});

describe("formatHeatmap", () => {
  it("includes header and route paths", () => {
    const root = makeNode("shop", [makeNode("[id]")]);
    const report = buildHeatmap(root);
    const output = formatHeatmap(report);
    expect(output).toContain("Route Heatmap");
    expect(output).toContain("/shop");
    expect(output).toContain("[id]");
    expect(output).toContain("Hottest");
    expect(output).toContain("Average");
  });
});
