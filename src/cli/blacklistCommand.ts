import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import {
  checkBlacklist,
  formatBlacklistReport,
  BlacklistRule,
} from '../scanner/routeBlacklist';

export function registerBlacklistCommand(program: Command): void {
  program
    .command('blacklist')
    .description('Check routes against a blacklist of forbidden patterns')
    .option('-d, --dir <dir>', 'App directory', 'app')
    .option('-c, --config <config>', 'Config file path')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = path.resolve(opts.dir ?? config.appDir ?? 'app');
      const rules: BlacklistRule[] = (config.blacklist ?? []) as BlacklistRule[];

      if (rules.length === 0) {
        console.warn(
          '⚠️  No blacklist rules configured. Add a "blacklist" array to your routewatch config.'
        );
        process.exit(0);
      }

      const root = await scanRoutes(appDir);
      const report = checkBlacklist(root, rules);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        process.stdout.write(formatBlacklistReport(report));
      }

      if (report.total > 0) {
        process.exit(1);
      }
    });
}
