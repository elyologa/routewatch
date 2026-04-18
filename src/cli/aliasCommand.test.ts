import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import fs from "fs";
import os from "os";
import path from "path";
import { registerAliasCommand } from "./aliasCommand";

function makeAppDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alias-test-"));
  const about = path.join(dir, "about");
  fs.mkdirSync(about);
  fs.writeFileSync(path.join(about, "page.tsx"), "");
  return dir;
}

function makeConfig(appDir: string, aliases = {}): string {
  const cfg = path.join(appDir, "routewatch.json");
  fs.writeFileSync(cfg, JSON.stringify({ appDir, aliases }));
  return cfg;
}

describe("aliasCommand", () => {
  let logs: string[];

  beforeEach(() => {
    logs = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
  });

  it("prints no aliases message when none defined", async () => {
    const appDir = makeAppDir();
    const cfg = makeConfig(appDir);
    const program = new Command();
    registerAliasCommand(program);
    await program.parseAsync(["node", "test", "alias", "-c", cfg]);
    expect(logs.join("\n")).toContain("No aliases defined.");
  });

  it("resolves a known alias", async () => {
    const appDir = makeAppDir();
    const cfg = makeConfig(appDir, { "/about": "/a" });
    const program = new Command();
    registerAliasCommand(program);
    await program.parseAsync(["node", "test", "alias", "-c", cfg, "-r", "/a"]);
    expect(logs.join("\n")).toContain("/about");
  });

  it("reports unknown alias", async () => {
    const appDir = makeAppDir();
    const cfg = makeConfig(appDir);
    const program = new Command();
    registerAliasCommand(program);
    await program.parseAsync(["node", "test", "alias", "-c", cfg, "-r", "/x"]);
    expect(logs.join("\n")).toContain("No route found");
  });
});
