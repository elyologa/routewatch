import { Command } from 'commander';
import * as path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { traceRoutes, formatTraceReport } from '../scanner/routeTracer';
import { renderTraceReport } from '../visualizer/traceRenderer';

export function registerTraceCommand(program: Command): void {
  program
    .command('trace')
    .description('Trace the full route hierarchy and display ancestry information')
    .option('-d, --dir <path>', 'Path to Next.js app directory')
    .option('-c, --config <path>', 'Path to routewatch config file')
    .option('--json', 'Output raw JSON')
    .option('--plain', 'Output plain text without color')
    .action(async (opts) => {
      try {
        const config = await resolveConfig(opts.config);
        const appDir = opts.dir
          ? path.resolve(opts.dir)
          : path.resolve(config.appDir ?? 'app');

        const root = await scanRoutes(appDir);
        const report = traceRoutes(root);

        if (opts.json) {
          console.log(JSON.stringify(report, null, 2));
          return;
        }

        if (opts.plain) {
          console.log(formatTraceReport(report));
          return;
        }

        console.log(renderTraceReport(report));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
