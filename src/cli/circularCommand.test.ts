import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import os from "os";
import { registerCircularCommand } from "./circularCommand";

function makeAppDir(structure: Record<string, string[]>): string {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "rw-circular-"));
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

describe("circularCommand", () => {
  let logs: string[];

  beforeEach(() => {
    logs = [];
    vi.spyOn(console, "log").mockImplementation((...args) =>
      logs.push(args.join(" "))
    );
  });

  it("registers the circular command on the program", () => {
    const program = new Command();
    registerCircularCommand(program);
    const cmd = program.commands.find((c) => c.name() === "circular");
    expect(cmd).toBeDefined();
  });

  it("reports no circular references for a clean app dir", async () => {
    const appDir = makeAppDir({
      "": ["page.tsx"],
      dashboard: ["page.tsx"],
      "dashboard/settings": ["page.tsx"],
    });
    const cfgPath = makeConfig(appDir);
    const program = new Command();
    registerCircularCommand(program);
    await program.parseAsync(["node", "test", "circular", "-d", appDir, "-c", cfgPath]);
    expect(logs.some((l) => l.includes("No circular references found"))).toBe(true);
  });

  it("outputs JSON when --json flag is set", async () => {
    const appDir = makeAppDir({ "": ["page.tsx"] });
    const cfgPath = makeConfig(appDir);
    const program = new Command();
    registerCircularCommand(program);
    await program.parseAsync(["node", "test", "circular", "-d", appDir, "-c", cfgPath, "--json"]);
    const jsonOutput = logs.find((l) => l.startsWith("["));
    expect(jsonOutput).toBeDefined();
    expect(() => JSON.parse(jsonOutput!)).not.toThrow();
  });
});
