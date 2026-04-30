import type { Command } from 'commander';
import * as path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { analyzeTrend, formatTrendReport } from '../scanner/routeTrend';

export function registerTrendCommand(program: Command): void {
  program
    .command('trend')
    .description('Analyze route growth trends based on filesystem timestamps')
    .option('-d, --dir <path>', 'Path to the Next.js app directory')
    .option('--json', 'Output results as JSON')
    .option('--top <n>', 'Number of top entries to show', '5')
    .action(async (opts) => {
      const config = await resolveConfig(opts);
      const appDir = opts.dir
        ? path.resolve(opts.dir)
        : path.resolve(config.appDir ?? 'app');

      let root;
      try {
        root = scanRoutes(appDir);
      } catch (err: any) {
        console.error(`Error scanning routes: ${err.message}`);
        process.exit(1);
      }

      const report = analyzeTrend(root);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      const top = parseInt(opts.top, 10) || 5;
      const trimmed = {
        ...report,
        fastestGrowing: report.fastestGrowing.slice(0, top),
        newest: report.newest.slice(0, top),
        oldest: report.oldest.slice(0, top),
      };

      console.log(formatTrendReport(trimmed));

      if (report.entries.length === 0) {
        console.warn(
          'No trend data available. Ensure the app directory exists and contains route folders.'
        );
      }
    });
}
