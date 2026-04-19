import { documentRoutes, formatDocs } from "./routeDocumenter";
import { RouteNode } from "../types";

function makeNode(overrides: Partial<RouteNode> & { segment: string }): RouteNode {
  return {
    children: [],
    isPage: true,
    hasLayout: false,
    hasLoading: false,
    hasError: false,
    ...overrides,
  };
}

describe("documentRoutes", () => {
  it("documents a static route", () => {
    const root = makeNode({ segment: "", isPage: false, children: [makeNode({ segment: "about" })] });
    const docs = documentRoutes(root);
    expect(docs).toHaveLength(1);
    expect(docs[0].path).toBe("/about");
    expect(docs[0].isDynamic).toBe(false);
    expect(docs[0].isCatchAll).toBe(false);
  });

  it("documents a dynamic route", () => {
    const root = makeNode({ segment: "", isPage: false, children: [makeNode({ segment: "[id]" })] });
    const docs = documentRoutes(root);
    expect(docs[0].isDynamic).toBe(true);
    expect(docs[0].isCatchAll).toBe(false);
  });

  it("documents a catch-all route", () => {
    const root = makeNode({ segment: "", isPage: false, children: [makeNode({ segment: "[...slug]" })] });
    const docs = documentRoutes(root);
    expect(docs[0].isCatchAll).toBe(true);
  });

  it("includes layout/loading/error flags", () => {
    const node = makeNode({ segment: "dashboard", hasLayout: true, hasLoading: true, hasError: false });
    const root = makeNode({ segment: "", isPage: false, children: [node] });
    const docs = documentRoutes(root);
    expect(docs[0].hasLayout).toBe(true);
    expect(docs[0].hasLoading).toBe(true);
    expect(docs[0].hasError).toBe(false);
    expect(docs[0].description).toContain("with layout");
  });

  it("handles nested routes", () => {
    const child = makeNode({ segment: "settings" });
    const parent = makeNode({ segment: "user", isPage: true, children: [child] });
    const root = makeNode({ segment: "", isPage: false, children: [parent] });
    const docs = documentRoutes(root);
    expect(docs).toHaveLength(2);
    expect(docs[1].path).toBe("/user/settings");
  });
});

describe("formatDocs", () => {
  it("formats docs as readable string", () => {
    const root = makeNode({ segment: "", isPage: false, children: [makeNode({ segment: "home" })] });
    const docs = documentRoutes(root);
    const output = formatDocs(docs);
    expect(output).toContain("/home");
    expect(output).toContain("dynamic=false");
  });
});
