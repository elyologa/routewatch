import { describe, it, expect } from "vitest";
import {
  normalizeSegment,
  normalizeRoute,
  normalizeRoutes,
  formatNormalized,
} from "./routeNormalizer";
import { RouteNode } from "../types";

function makeNode(
  segment: string,
  children: RouteNode[] = []
): RouteNode {
  return { segment, children, path: segment };
}

describe("normalizeSegment", () => {
  it("returns static segment unchanged", () => {
    expect(normalizeSegment("about")).toBe("about");
  });

  it("strips route group parens", () => {
    expect(normalizeSegment("(marketing)")).toBe("");
  });

  it("normalizes dynamic segment", () => {
    expect(normalizeSegment("[id]")).toBe(":id");
  });

  it("normalizes catch-all segment", () => {
    expect(normalizeSegment("[...slug]")).toBe(":slug*");
  });

  it("normalizes optional catch-all segment", () => {
    expect(normalizeSegment("[[...slug]]")).toBe(":slug*?");
  });
});

describe("normalizeRoute", () => {
  it("normalizes a static path", () => {
    const result = normalizeRoute("/blog/post");
    expect(result.normalized).toBe("/blog/post");
    expect(result.isDynamic).toBe(false);
    expect(result.depth).toBe(2);
  });

  it("normalizes a dynamic path", () => {
    const result = normalizeRoute("/blog/[id]");
    expect(result.normalized).toBe("/blog/:id");
    expect(result.isDynamic).toBe(true);
  });

  it("normalizes a catch-all path", () => {
    const result = normalizeRoute("/docs/[...slug]");
    expect(result.normalized).toBe("/docs/:slug*");
    expect(result.isCatchAll).toBe(true);
  });

  it("strips group segments from normalized output", () => {
    const result = normalizeRoute("/(marketing)/about");
    expect(result.normalized).toBe("/about");
    expect(result.depth).toBe(1);
  });
});

describe("normalizeRoutes", () => {
  it("collects and normalizes all paths from a tree", () => {
    const tree = makeNode("", [
      makeNode("blog", [
        makeNode("[id]"),
      ]),
      makeNode("about"),
    ]);
    const results = normalizeRoutes(tree);
    const normalized = results.map((r) => r.normalized);
    expect(normalized).toContain("/blog");
    expect(normalized).toContain("/blog/:id");
    expect(normalized).toContain("/about");
  });
});

describe("formatNormalized", () => {
  it("formats routes into a readable string", () => {
    const routes = [normalizeRoute("/blog/[id]"), normalizeRoute("/about")];
    const output = formatNormalized(routes);
    expect(output).toContain("Normalized Routes:");
    expect(output).toContain("/blog/:id");
    expect(output).toContain("dynamic");
    expect(output).toContain("/about");
  });
});
