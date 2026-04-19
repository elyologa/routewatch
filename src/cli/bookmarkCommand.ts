import { Command } from "commander";
import fs from "fs";
import path from "path";
import { addBookmark, removeBookmark, formatBookmarks, BookmarkStore } from "../scanner/routeBookmark";

const DEFAULT_FILE = ".routewatch-bookmarks.json";

function loadStore(file: string): BookmarkStore {
  if (!fs.existsSync(file)) return { bookmarks: [] };
  return JSON.parse(fs.readFileSync(file, "utf-8")) as BookmarkStore;
}

function saveStore(file: string, store: BookmarkStore): void {
  fs.writeFileSync(file, JSON.stringify(store, null, 2));
}

export function registerBookmarkCommand(program: Command): void {
  const cmd = program.command("bookmark").description("Manage route bookmarks");

  cmd
    .command("add <route>")
    .description("Bookmark a route path")
    .option("-l, --label <label>", "Optional label")
    .option("-f, --file <file>", "Bookmark store file", DEFAULT_FILE)
    .action((route: string, opts: { label?: string; file: string }) => {
      const file = path.resolve(opts.file);
      const store = addBookmark(loadStore(file), route, opts.label);
      saveStore(file, store);
      console.log(`Bookmarked: ${route}`);
    });

  cmd
    .command("remove <route>")
    .description("Remove a bookmarked route")
    .option("-f, --file <file>", "Bookmark store file", DEFAULT_FILE)
    .action((route: string, opts: { file: string }) => {
      const file = path.resolve(opts.file);
      const store = removeBookmark(loadStore(file), route);
      saveStore(file, store);
      console.log(`Removed bookmark: ${route}`);
    });

  cmd
    .command("list")
    .description("List all bookmarked routes")
    .option("-f, --file <file>", "Bookmark store file", DEFAULT_FILE)
    .action((opts: { file: string }) => {
      const file = path.resolve(opts.file);
      const store = loadStore(file);
      console.log(formatBookmarks(store));
    });
}
