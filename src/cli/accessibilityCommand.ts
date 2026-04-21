import { Command } from "commander";
import path from "path";
import { scanRoutes } from "../scanner/routeScanner";
import { resolveConfig } from "./config";
import {
  auditAccessibility,
  formatAccessibilityReport,
} from "../scanner/routeAccessibility";

export function registerAccessibilityCommand(program: Command): void {
  program
    .command("accessibility")
    .alias("a11y")
    .description("Audit route tree for accessibility concerns")
    .option("-d, --dir <path>", "Path to Next.js app directory")
    .option("-c, --config <path>", "Path to routewatch config file")
    .option("--json", "Output results as JSON")
    .option("--errors-only", "Show only error-severity issues")
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir
        ? path.resolve(opts.dir)
        : path.resolve(config.appDir ?? "app");

      const root = await scanRoutes(appDir);
      let report = auditAccessibility(root);

      if (opts.errorsOnly) {
        report = {
          ...report,
          issues: report.issues.filter((i) => i.severity === "error"),
          affectedRoutes: new Set(
            report.issues
              .filter((i) => i.severity === "error")
              .map((i) => i.path)
          ).size,
        };
      }

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      console.log(formatAccessibilityReport(report));

      if (report.issues.some((i) => i.severity === "error")) {
        process.exitCode = 1;
      }
    });
}
