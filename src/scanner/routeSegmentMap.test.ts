import { describe, it, expect } from "vitest";
import { buildSegmentMap, formatSegmentMap } from "./routeSegmentMap";
import { RouteNode } from "./routeScanner";

function makeNode(
  segment: string,
  children: RouteNode[] = []
): RouteNode {
  return { segment, children, path: segment };
}

describe("buildSegmentMap", () => {
  it("returns empty report for no roots", () => {
    const report = buildSegmentMap([]);
    expect(report.totalUnique).toBe(0);
    expect(report.mostUsed).toBeNull();
    expect(report.segments).toHaveLength(0);
  });

  it("maps a single root node", () => {
    const report = buildSegmentMap([makeNode("dashboard")]);
    expect(report.totalUnique).toBe(1);
    expect(report.segments[0].segment).toBe("dashboard");
    expect(report.segments[0].count).toBe(1);
    expect(report.segments[0].isDynamic).toBe(false);
    expect(report.segments[0].isGroup).toBe(false);
  });

  it("counts repeated segments across branches", () => {
    const tree = makeNode("app", [
      makeNode("[id]", [makeNode("edit")]),
      makeNode("new", [makeNode("edit")]),
    ]);
    const report = buildSegmentMap([tree]);
    const editEntry = report.segments.find((s) => s.segment === "edit");
    expect(editEntry).toBeDefined();
    expect(editEntry!.count).toBe(2);
  });

  it("marks dynamic segments correctly", () => {
    const report = buildSegmentMap([makeNode("[slug]")]);
    expect(report.segments[0].isDynamic).toBe(true);
    expect(report.segments[0].isCatchAll).toBe(false);
  });

  it("marks catch-all segments correctly", () => {
    const report = buildSegmentMap([makeNode("[...rest]")]);
    expect(report.segments[0].isCatchAll).toBe(true);
  });

  it("marks group segments correctly", () => {
    const report = buildSegmentMap([makeNode("(auth)")]);
    expect(report.segments[0].isGroup).toBe(true);
  });

  it("sets mostUsed to the highest count segment", () => {
    const tree = makeNode("a", [
      makeNode("shared"),
      makeNode("b", [makeNode("shared"), makeNode("shared")]),
    ]);
    const report = buildSegmentMap([tree]);
    expect(report.mostUsed?.segment).toBe("shared");
    expect(report.mostUsed?.count).toBe(3);
  });
});

describe("formatSegmentMap", () => {
  it("includes header with unique count", () => {
    const report = buildSegmentMap([makeNode("home")]);
    const output = formatSegmentMap(report);
    expect(output).toContain("1 unique segment");
    expect(output).toContain("home");
  });

  it("includes most used footer", () => {
    const report = buildSegmentMap([makeNode("home")]);
    const output = formatSegmentMap(report);
    expect(output).toContain("Most used segment");
  });

  it("labels dynamic segments", () => {
    const report = buildSegmentMap([makeNode("[id]")]);
    const output = formatSegmentMap(report);
    expect(output).toContain("dynamic");
  });
});
