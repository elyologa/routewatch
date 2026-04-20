import { describe, it, expect } from "vitest";
import {
  collectCoverage,
  computeCoverage,
  formatCoverageReport,
  walk,
} from "./routeCoverage";
import { RouteNode } from "./routeScanner";

function makeNode(
  segment: string,
  overrides: Partial<RouteNode> = {}
): RouteNode {
  return { segment, children: [], hasPage: false, ...overrides };
}

describe("computeCoverage", () => {
  it("returns 0% score when nothing is present", () => {
    const node = makeNode("about");
    const entry = computeCoverage(node, "");
    expect(entry.coverageScore).toBe(0);
    expect(entry.hasPage).toBe(false);
  });

  it("returns 100% score when all files are present", () => {
    const node = makeNode("dashboard", {
      hasPage: true,
      files: ["layout", "loading", "error"],
    });
    const entry = computeCoverage(node, "");
    expect(entry.coverageScore).toBe(100);
  });

  it("builds correct path from parent", () => {
    const node = makeNode("settings");
    const entry = computeCoverage(node, "/dashboard");
    expect(entry.path).toBe("/dashboard/settings");
  });
});

describe("walk", () => {
  it("collects entries for all nodes", () => {
    const root = makeNode("app", {
      hasPage: true,
      children: [
        makeNode("about", { hasPage: true }),
        makeNode("contact"),
      ],
    });
    const entries = walk(root);
    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.path)).toContain("/app/about");
  });
});

describe("collectCoverage", () => {
  it("computes aggregate statistics", () => {
    const root = makeNode("app", {
      hasPage: true,
      files: ["layout", "loading", "error"],
      children: [makeNode("empty")],
    });
    const report = collectCoverage(root);
    expect(report.totalRoutes).toBe(2);
    expect(report.fullyCovered).toBe(1);
    expect(report.uncovered).toBe(1);
    expect(report.overallScore).toBe(50);
  });

  it("returns 0 overall score for empty tree", () => {
    const root = makeNode("app");
    const report = collectCoverage(root);
    expect(report.overallScore).toBe(0);
    expect(report.uncovered).toBe(1);
  });
});

describe("formatCoverageReport", () => {
  it("includes route path and score in output", () => {
    const root = makeNode("app", { hasPage: true });
    const report = collectCoverage(root);
    const output = formatCoverageReport(report);
    expect(output).toContain("/app");
    expect(output).toContain("25%");
    expect(output).toContain("Overall Score");
  });
});
