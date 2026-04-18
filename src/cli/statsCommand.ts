import { Command } from 'commander';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { computeRouteStats, formatStats } from '../scanner/routeStats';

export function registerStatsCommand(program: Command): void {
  program
    .command('stats')
    .description('Print statistics about the Next.js app router structure')
    .option('-d, --dir <path>', 'Path to the Next.js app directory')
    .option('--json', 'Output stats as JSON')
    .action(async (opts) => {
      try {
        const config = await resolveConfig({ appDir: opts.dir });
        const root = await scanRoutes(config.appDir);
        const stats = computeRouteStats(root);

        if (opts.json) {
          console.log(JSON.stringify(stats, null, 2));
        } else {
          console.log('\nRoute Statistics');
          console.log('================');
          console.log(formatStats(stats));
        }
      } catch (err) {
        console.error('Error computing stats:', (err as Error).message);
        process.exit(1);
      }
    });
}
