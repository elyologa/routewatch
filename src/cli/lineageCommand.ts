import { Command } from 'commander';
import * as path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { collectLineage, formatLineageReport } from '../scanner/routeLineage';

export function registerLineageCommand(program: Command): void {
  program
    .command('lineage')
    .description('Show parent-child lineage of all routes in the app')
    .option('-d, --dir <path>', 'Path to Next.js app directory')
    .option('-c, --config <path>', 'Path to routewatch config file')
    .option('--json', 'Output as JSON')
    .option('--max-depth <n>', 'Only show routes up to this depth', parseInt)
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir ?? config.appDir ?? path.join(process.cwd(), 'app');

      const root = await scanRoutes(appDir);
      const report = collectLineage(root);

      let filtered = report;
      if (opts.maxDepth !== undefined) {
        filtered = {
          ...report,
          entries: report.entries.filter((e) => e.depth <= opts.maxDepth),
          leaves: report.leaves.filter((r) =>
            report.entries.find((e) => e.route === r && e.depth <= opts.maxDepth)
          ),
        };
      }

      if (opts.json) {
        console.log(JSON.stringify(filtered, null, 2));
      } else {
        console.log(formatLineageReport(filtered));
      }
    });
}
