import type { Command } from 'commander';
import * as path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import {
  collectOwnership,
  formatOwnershipReport,
  type OwnershipRule,
} from '../scanner/routeOwnership';

export function registerOwnershipCommand(program: Command): void {
  program
    .command('ownership')
    .description('Show route ownership based on configured rules')
    .option('-c, --config <path>', 'path to routewatch config file')
    .option('--json', 'output as JSON')
    .option('--unowned', 'show only unowned routes')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = path.resolve(config.appDir ?? 'app');
      const root = await scanRoutes(appDir);

      const rules: OwnershipRule[] = config.ownership ?? [];

      if (!rules.length) {
        console.warn(
          'No ownership rules defined. Add an "ownership" array to your config.'
        );
        process.exit(0);
      }

      const report = collectOwnership(root, rules);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      if (opts.unowned) {
        if (!report.unowned.length) {
          console.log('All routes have an assigned owner.');
        } else {
          console.log('Unowned routes:');
          for (const r of report.unowned) console.log(`  ${r}`);
        }
        return;
      }

      console.log(formatOwnershipReport(report));
    });
}
