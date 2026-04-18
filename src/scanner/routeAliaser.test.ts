import { describe, it, expect } from "vitest";
import {
  applyAliases,
  resolveAlias,
  formatAliases,
  collectPaths,
} from "./routeAliaser";
import { RouteNode } from "../visualizer";

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, isPage: children.length === 0 };
}

describe("collectPaths", () => {
  it("collects all paths from tree", () => {
    const tree = makeNode("", [
      makeNode("about"),
      makeNode("blog", [makeNode("[slug]")]),
    ]);
    const paths = collectPaths(tree);
    expect(paths).toContain("/about");
    expect(paths).toContain("/blog/[slug]");
  });
});

describe("applyAliases", () => {
  it("maps known paths to aliases", () => {
    const result = applyAliases(["/about", "/blog"], { "/about": "/a" });
    expect(result).toContainEqual({ path: "/about", alias: "/a" });
    expect(result).toContainEqual({ path: "/blog", alias: "/blog" });
  });
});

describe("resolveAlias", () => {
  it("returns path for a given alias", () => {
    expect(resolveAlias("/a", { "/about": "/a" })).toBe("/about");
  });

  it("returns null when alias not found", () => {
    expect(resolveAlias("/missing", {})).toBeNull();
  });
});

describe("formatAliases", () => {
  it("formats aliased routes", () => {
    const out = formatAliases([{ path: "/about", alias: "/a" }]);
    expect(out).toContain("/a");
    expect(out).toContain("/about");
  });

  it("returns message when no aliases", () => {
    const out = formatAliases([{ path: "/about", alias: "/about" }]);
    expect(out).toBe("No aliases defined.");
  });
});
