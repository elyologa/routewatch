import { Command } from "commander";
import path from "path";
import { scanRoutes } from "../scanner/routeScanner";
import { resolveConfig } from "./config";
import { collectCoverage, formatCoverageReport } from "../scanner/routeCoverage";

export function registerCoverageCommand(program: Command): void {
  program
    .command("coverage")
    .description("Report file coverage (page, layout, loading, error) per route")
    .option("-d, --dir <path>", "Path to Next.js app directory")
    .option("-c, --config <path>", "Path to routewatch config file")
    .option("--json", "Output as JSON")
    .option("--min-score <number>", "Only show routes below this coverage score", parseInt)
    .action(async (opts) => {
      try {
        const config = await resolveConfig(opts.config);
        const appDir = opts.dir
          ? path.resolve(opts.dir)
          : path.resolve(config.appDir ?? "app");

        const root = await scanRoutes(appDir);
        const report = collectCoverage(root);

        const minScore: number | undefined = opts.minScore;
        const filtered = minScore !== undefined
          ? {
              ...report,
              entries: report.entries.filter((e) => e.coverageScore < minScore),
            }
          : report;

        if (opts.json) {
          console.log(JSON.stringify(filtered, null, 2));
          return;
        }

        const output = formatCoverageReport(filtered);
        console.log(output);

        if (report.overallScore < 50) {
          console.warn(
            `\n⚠  Overall coverage is low (${report.overallScore}%). Consider adding layout, loading, and error files.`
          );
        }
      } catch (err) {
        console.error("coverage command failed:", (err as Error).message);
        process.exit(1);
      }
    });
}
