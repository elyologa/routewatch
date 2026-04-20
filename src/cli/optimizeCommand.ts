import { Command } from "commander";
import path from "path";
import { scanRoutes } from "../scanner/routeScanner";
import { resolveConfig } from "./config";
import { optimizeRoutes, formatOptimizationReport } from "../scanner/routeOptimizer";

export function registerOptimizeCommand(program: Command): void {
  program
    .command("optimize")
    .description("Analyze route structure and suggest optimizations")
    .option("-d, --dir <path>", "Path to Next.js app directory")
    .option("-c, --config <path>", "Path to routewatch config file")
    .option("--json", "Output results as JSON")
    .option("--min-score <number>", "Exit with error if score is below threshold", "0")
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir
        ? path.resolve(opts.dir)
        : path.resolve(config.appDir ?? "app");

      let root;
      try {
        root = scanRoutes(appDir);
      } catch {
        console.error(`Failed to scan routes in: ${appDir}`);
        process.exit(1);
      }

      const report = optimizeRoutes(root);
      const minScore = parseInt(opts.minScore, 10);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatOptimizationReport(report));
      }

      if (report.score < minScore) {
        console.error(
          `\nOptimization score ${report.score} is below required minimum ${minScore}.`
        );
        process.exit(1);
      }
    });
}
