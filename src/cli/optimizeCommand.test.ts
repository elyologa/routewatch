import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import fs from "fs";
import os from "os";
import path from "path";
import { registerOptimizeCommand } from "./optimizeCommand";

function makeAppDir(structure: Record<string, string[]>): string {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "rw-optimize-"));
  for (const [dir, files] of Object.entries(structure)) {
    const full = path.join(base, dir);
    fs.mkdirSync(full, { recursive: true });
    for (const f of files) {
      fs.writeFileSync(path.join(full, f), "");
    }
  }
  return base;
}

function makeConfig(appDir: string): string {
  const cfgPath = path.join(appDir, "routewatch.json");
  fs.writeFileSync(cfgPath, JSON.stringify({ appDir }));
  return cfgPath;
}

describe("optimize command", () => {
  let appDir: string;
  let logs: string[];
  let errors: string[];
  let exitCode: number | undefined;

  beforeEach(() => {
    appDir = makeAppDir({
      ".": [],
      "about": ["page.tsx"],
      "contact": ["page.tsx"],
    });
    logs = [];
    errors = [];
    exitCode = undefined;
    vi.spyOn(console, "log").mockImplementation((...a) => logs.push(a.join(" ")));
    vi.spyOn(console, "error").mockImplementation((...a) => errors.push(a.join(" ")));
    vi.spyOn(process, "exit").mockImplementation((code?: number) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    fs.rmSync(appDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("prints optimization report for a clean app dir", async () => {
    const cfg = makeConfig(appDir);
    const program = new Command();
    registerOptimizeCommand(program);
    await program.parseAsync(["node", "rw", "optimize", "-d", appDir, "-c", cfg]);
    expect(logs.some((l) => l.includes("Score"))).toBe(true);
    expect(exitCode).toBeUndefined();
  });

  it("outputs JSON when --json flag is set", async () => {
    const cfg = makeConfig(appDir);
    const program = new Command();
    registerOptimizeCommand(program);
    await program.parseAsync(["node", "rw", "optimize", "-d", appDir, "-c", cfg, "--json"]);
    const json = JSON.parse(logs.join(""));
    expect(json).toHaveProperty("score");
    expect(json).toHaveProperty("hints");
  });

  it("exits with error when score is below --min-score", async () => {
    const cfg = makeConfig(appDir);
    const program = new Command();
    registerOptimizeCommand(program);
    await expect(
      program.parseAsync(["node", "rw", "optimize", "-d", appDir, "-c", cfg, "--min-score", "101"])
    ).rejects.toThrow();
    expect(exitCode).toBe(1);
  });
});
