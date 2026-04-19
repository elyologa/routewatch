import { RouteNode } from "../scanner/routeScanner";

export interface BookmarkedRoute {
  path: string;
  label?: string;
  addedAt: string;
}

export interface BookmarkStore {
  bookmarks: BookmarkedRoute[];
}

export function buildPath(node: RouteNode, prefix = ""): string {
  const current = prefix + "/" + node.segment;
  return current;
}

export function collectPaths(node: RouteNode, prefix = ""): string[] {
  const current = prefix === "" ? "/" + node.segment : prefix + "/" + node.segment;
  const paths: string[] = [current];
  for (const child of node.children ?? []) {
    paths.push(...collectPaths(child, current));
  }
  return paths;
}

export function addBookmark(
  store: BookmarkStore,
  path: string,
  label?: string
): BookmarkStore {
  const existing = store.bookmarks.find((b) => b.path === path);
  if (existing) return store;
  return {
    bookmarks: [
      ...store.bookmarks,
      { path, label, addedAt: new Date().toISOString() },
    ],
  };
}

export function removeBookmark(store: BookmarkStore, path: string): BookmarkStore {
  return { bookmarks: store.bookmarks.filter((b) => b.path !== path) };
}

export function formatBookmarks(store: BookmarkStore): string {
  if (store.bookmarks.length === 0) return "No bookmarks saved.";
  return store.bookmarks
    .map((b) => {
      const tag = b.label ? ` (${b.label})` : "";
      return `  ${b.path}${tag}  [${b.addedAt}]`;
    })
    .join("\n");
}
