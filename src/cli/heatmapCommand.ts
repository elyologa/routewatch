import { Command } from 'commander';
import path from 'node:path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { computeHeatmap, formatHeatmapReport } from '../scanner/routeHeatmap';

export function registerHeatmapCommand(program: Command): void {
  program
    .command('heatmap')
    .description('Show a complexity heatmap of all routes, highlighting hot spots')
    .option('-d, --dir <path>', 'Path to the Next.js app directory')
    .option('-c, --config <path>', 'Path to routewatch config file')
    .option('--top <n>', 'Show only the top N hottest routes', '10')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir
        ? path.resolve(opts.dir)
        : path.resolve(config.appDir ?? 'app');

      let tree;
      try {
        tree = scanRoutes(appDir);
      } catch {
        console.error(`Error: could not scan directory "${appDir}"`);
        process.exit(1);
      }

      const heatmap = computeHeatmap(tree);
      const topN = parseInt(opts.top, 10);
      const limited = Number.isFinite(topN) && topN > 0
        ? heatmap.slice(0, topN)
        : heatmap;

      if (opts.json) {
        console.log(JSON.stringify(limited, null, 2));
        return;
      }

      const report = formatHeatmapReport(limited);
      console.log(report);
    });
}
