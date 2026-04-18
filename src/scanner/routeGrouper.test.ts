import { describe, it, expect } from "vitest";
import {
  groupBySegment,
  groupByPrefixes,
  flattenRoutes,
} from "./routeGrouper";
import { RouteNode } from "../visualizer";

function makeNode(
  segment: string,
  isPage = false,
  children: RouteNode[] = []
): RouteNode {
  return { segment, path: "/" + segment, isPage, isDead: false, children };
}

describe("groupBySegment", () => {
  it("groups routes by first path segment", () => {
    const routes = [
      makeNode("api"),
      makeNode("dashboard"),
      { ...makeNode("api"), path: "/api/users" },
    ];
    const map = groupBySegment(routes);
    expect(map.get("api")?.length).toBe(2);
    expect(map.get("dashboard")?.length).toBe(1);
  });

  it("uses / as key for root routes", () => {
    const routes = [{ ...makeNode(""), path: "/" }];
    const map = groupBySegment(routes);
    expect(map.has("/")).toBe(true);
  });
});

describe("groupByPrefixes", () => {
  it("groups routes matching given prefixes", () => {
    const routes = [
      { ...makeNode("api"), path: "/api/users" },
      { ...makeNode("dashboard"), path: "/dashboard/home" },
      { ...makeNode("about"), path: "/about" },
    ];
    const groups = groupByPrefixes(routes, ["/api", "/dashboard"]);
    expect(groups.find((g) => g.prefix === "/api")?.routes.length).toBe(1);
    expect(groups.find((g) => g.prefix === "/dashboard")?.routes.length).toBe(1);
    expect(groups.find((g) => g.prefix === "*")?.routes.length).toBe(1);
  });
});

describe("flattenRoutes", () => {
  it("returns only leaf page nodes", () => {
    const tree = makeNode("app", false, [
      makeNode("about", true, []),
      makeNode("blog", false, [makeNode("[slug]", true, [])]),
    ]);
    const flat = flattenRoutes(tree);
    expect(flat.length).toBe(2);
    expect(flat.some((r) => r.segment === "about")).toBe(true);
    expect(flat.some((r) => r.segment === "[slug]")).toBe(true);
  });
});
