import { describe, it, expect } from "vitest";
import {
  checkCircularRoutes,
  formatCircularReport,
  buildPath,
} from "./routeCircularDetector";
import { RouteNode } from "../types";

function makeNode(
  segment: string,
  children: RouteNode[] = []
): RouteNode {
  return { segment, children, path: `/${segment}` };
}

describe("buildPath", () => {
  it("returns root path for empty parent", () => {
    expect(buildPath(makeNode("dashboard"))).toBe("/dashboard");
  });

  it("concatenates parent and segment", () => {
    expect(buildPath(makeNode("settings"), "/dashboard")).toBe(
      "/dashboard/settings"
    );
  });
});

describe("checkCircularRoutes", () => {
  it("returns empty array for a clean tree", () => {
    const root = makeNode("app", [
      makeNode("dashboard", [makeNode("overview")]),
      makeNode("settings"),
    ]);
    expect(checkCircularRoutes(root)).toHaveLength(0);
  });

  it("detects no false positives on sibling segments", () => {
    const root = makeNode("app", [
      makeNode("users"),
      makeNode("users"),
    ]);
    // Duplicate siblings are not circular — different paths via parent
    const result = checkCircularRoutes(root);
    expect(result).toHaveLength(0);
  });

  it("handles deeply nested unique paths", () => {
    const root = makeNode("a", [
      makeNode("b", [makeNode("c", [makeNode("d")])]),
    ]);
    expect(checkCircularRoutes(root)).toHaveLength(0);
  });
});

describe("formatCircularReport", () => {
  it("returns no-issue message when empty", () => {
    expect(formatCircularReport([])).toBe("No circular references found.");
  });

  it("formats issues correctly", () => {
    const refs = [
      { path: "/a/b", reason: 'Circular reference detected at "/a/b"' },
    ];
    const output = formatCircularReport(refs);
    expect(output).toContain("1 circular reference");
    expect(output).toContain("[CIRCULAR]");
    expect(output).toContain("/a/b");
  });
});
