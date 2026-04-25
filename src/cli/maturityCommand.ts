import { Command } from 'commander';
import * as path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { assessMaturity, formatMaturityReport } from '../scanner/routeMaturity';
import { formatJson } from '../reporter/reportFormatter';

export function registerMaturityCommand(program: Command): void {
  program
    .command('maturity')
    .description('Assess the maturity level of each route based on age, tests, and types')
    .option('-d, --dir <path>', 'Path to Next.js app directory')
    .option('-c, --config <path>', 'Path to config file')
    .option('--json', 'Output as JSON')
    .option('--min-level <level>', 'Filter to routes at or below maturity level (new|developing|stable|mature)')
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

      const report = assessMaturity(root, appDir);

      if (opts.minLevel) {
        const order = ['new', 'developing', 'stable', 'mature'];
        const maxIndex = order.indexOf(opts.minLevel);
        if (maxIndex === -1) {
          console.error(`Invalid maturity level: ${opts.minLevel}`);
          process.exit(1);
        }
        report.routes = report.routes.filter(
          (r) => order.indexOf(r.maturityLevel) <= maxIndex
        );
        const summary = { new: 0, developing: 0, stable: 0, mature: 0 };
        for (const r of report.routes) summary[r.maturityLevel]++;
        report.summary = summary;
      }

      if (opts.json) {
        console.log(formatJson(report));
      } else {
        console.log(formatMaturityReport(report));
      }
    });
}
