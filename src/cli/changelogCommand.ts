import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { computeChangelog, formatChangelog } from '../scanner/routeChangelog';
import fs from 'fs';

export function registerChangelogCommand(program: Command): void {
  program
    .command('changelog <previousSnapshot> <appDir>')
    .description('Show route changes between a snapshot and the current app dir')
    .option('--json', 'Output as JSON')
    .option('--config <path>', 'Path to config file')
    .action(async (previousSnapshot: string, appDir: string, opts) => {
      const config = await resolveConfig(opts.config);
      const snapshotPath = path.resolve(previousSnapshot);

      if (!fs.existsSync(snapshotPath)) {
        console.error(`Snapshot file not found: ${snapshotPath}`);
        process.exit(1);
      }

      const prevTree = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
      const resolvedApp = path.resolve(appDir || config.appDir || 'app');
      const currTree = await scanRoutes(resolvedApp);

      const changelog = computeChangelog(prevTree, currTree);

      if (opts.json) {
        console.log(JSON.stringify(changelog, null, 2));
      } else {
        console.log(formatChangelog(changelog));
      }
    });
}
