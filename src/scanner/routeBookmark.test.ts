import { addBookmark, removeBookmark, formatBookmarks, BookmarkStore } from "./routeBookmark";

function emptyStore(): BookmarkStore {
  return { bookmarks: [] };
}

describe("addBookmark", () => {
  it("adds a bookmark", () => {
    const store = addBookmark(emptyStore(), "/dashboard", "Main");
    expect(store.bookmarks).toHaveLength(1);
    expect(store.bookmarks[0].path).toBe("/dashboard");
    expect(store.bookmarks[0].label).toBe("Main");
  });

  it("does not duplicate existing path", () => {
    let store = addBookmark(emptyStore(), "/dashboard");
    store = addBookmark(store, "/dashboard");
    expect(store.bookmarks).toHaveLength(1);
  });

  it("adds multiple distinct paths", () => {
    let store = addBookmark(emptyStore(), "/a");
    store = addBookmark(store, "/b");
    expect(store.bookmarks).toHaveLength(2);
  });
});

describe("removeBookmark", () => {
  it("removes an existing bookmark", () => {
    let store = addBookmark(emptyStore(), "/dashboard");
    store = removeBookmark(store, "/dashboard");
    expect(store.bookmarks).toHaveLength(0);
  });

  it("is a no-op for unknown path", () => {
    const store = addBookmark(emptyStore(), "/dashboard");
    const result = removeBookmark(store, "/other");
    expect(result.bookmarks).toHaveLength(1);
  });
});

describe("formatBookmarks", () => {
  it("shows message when empty", () => {
    expect(formatBookmarks(emptyStore())).toBe("No bookmarks saved.");
  });

  it("formats bookmarks with label", () => {
    const store = addBookmark(emptyStore(), "/dashboard", "Home");
    const out = formatBookmarks(store);
    expect(out).toContain("/dashboard");
    expect(out).toContain("Home");
  });

  it("formats bookmarks without label", () => {
    const store = addBookmark(emptyStore(), "/settings");
    const out = formatBookmarks(store);
    expect(out).toContain("/settings");
  });
});
