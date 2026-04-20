import { Command } from "commander";
import path from "path";
import { scanRoutes } from "../scanner/routeScanner";
import {
  checkCircularRoutes,
  formatCircularReport,
} from "../scanner/routeCircularDetector";
import { resolveConfig } from "./config";

export function registerCircularCommand(program: Command): void {
  program
    .command("circular")
    .description("Detect circular references in the Next.js app router tree")
    .option("-d, --dir <path>", "Path to the Next.js app directory")
    .option("-c, --config <path>", "Path to routewatch config file")
    .option("--json", "Output results as JSON")
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir
        ? path.resolve(opts.dir)
        : path.resolve(config.appDir ?? "app");

      const root = scanRoutes(appDir);
      const refs = checkCircularRoutes(root);

      if (opts.json) {
        console.log(JSON.stringify(refs, null, 2));
        return;
      }

      const report = formatCircularReport(refs);
      console.log(report);

      if (refs.length > 0) {
        process.exitCode = 1;
      }
    });
}
