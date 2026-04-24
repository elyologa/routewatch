import { Command } from 'commander';
import * as path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { collectTimeline, formatTimeline } from '../scanner/routeTimeline';
import { renderTimelineReport } from '../visualizer/timelineRenderer';

export function registerTimelineCommand(program: Command): void {
  program
    .command('timeline')
    .description('Show age and modification timeline for all routes')
    .option('-d, --dir <path>', 'Path to Next.js app directory')
    .option('-c, --config <path>', 'Path to routewatch config file')
    .option('--json', 'Output as JSON')
    .option('--plain', 'Plain text output without colors')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir
        ? path.resolve(opts.dir)
        : path.resolve(config.appDir ?? 'app');

      let root;
      try {
        root = scanRoutes(appDir);
      } catch (err) {
        console.error(`Failed to scan routes in: ${appDir}`);
        process.exit(1);
      }

      const report = collectTimeline(root, appDir);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      if (opts.plain) {
        console.log(formatTimeline(report));
        return;
      }

      console.log(renderTimelineReport(report));
    });
}
