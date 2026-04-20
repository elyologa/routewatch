import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  buildPath,
  collectDependencies,
  buildDependencyGraph,
  formatDependencyGraph,
  RouteDependency,
} from "./routeDependency";
import { RouteNode } from "./routeScanner";

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, isDynamic: segment.startsWith("[") };
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "routedep-test-"));
}

describe("buildPath", () => {
  it("builds root path", () => {
    expect(buildPath(makeNode("dashboard"))).toBe("/dashboard");
  });

  it("builds nested path", () => {
    expect(buildPath(makeNode("settings"), "/dashboard")).toBe(
      "/dashboard/settings"
    );
  });
});

describe("collectDependencies", () => {
  it("returns dependency with empty imports when page file missing", () => {
    const node = makeNode("about");
    const result = collectDependencies(node, "/nonexistent", ["/home"]);
    expect(result).toHaveLength(1);
    expect(result[0].route).toBe("/about");
    expect(result[0].imports).toEqual([]);
    expect(result[0].dependsOn).toEqual([]);
  });

  it("extracts imports from real page file", () => {
    const tmpDir = makeTempDir();
    const pageDir = path.join(tmpDir, "shop");
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(
      path.join(pageDir, "page.tsx"),
      `import Foo from '@/app/home/page'; import Bar from '../utils';`
    );
    const node = makeNode("shop");
    const result = collectDependencies(node, tmpDir, ["/home", "/cart"]);
    expect(result[0].imports).toContain("@/app/home/page");
    expect(result[0].dependsOn).toContain("/home");
    fs.rmSync(tmpDir, { recursive: true });
  });
});

describe("buildDependencyGraph", () => {
  it("creates edges from dependsOn", () => {
    const nodes: RouteDependency[] = [
      { route: "/shop", imports: [], dependsOn: ["/home"] },
      { route: "/home", imports: [], dependsOn: [] },
    ];
    const graph = buildDependencyGraph(nodes);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toEqual({ from: "/shop", to: "/home" });
  });
});

describe("formatDependencyGraph", () => {
  it("shows no dependencies message when empty", () => {
    const graph = buildDependencyGraph([]);
    expect(formatDependencyGraph(graph)).toBe("No route dependencies found.");
  });

  it("formats graph with dependencies", () => {
    const nodes: RouteDependency[] = [
      { route: "/shop", imports: [], dependsOn: ["/home"] },
    ];
    const graph = buildDependencyGraph(nodes);
    const output = formatDependencyGraph(graph);
    expect(output).toContain("/shop");
    expect(output).toContain("/home");
  });
});
