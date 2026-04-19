import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { prioritizeRoutes, formatPriorities } from '../scanner/routePriority';

export function registerPriorityCommand(program: Command): void {
  program
    .command('priority')
    .description('Show route resolution priority order')
    .option('-d, --dir <path>', 'App directory to scan')
    .option('-c, --config <path>', 'Config file path')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir
        ? path.resolve(opts.dir)
        : path.resolve(config.appDir ?? 'app');

      const root = await scanRoutes(appDir);
      const priorities = prioritizeRoutes(root);

      if (opts.json) {
        console.log(JSON.stringify(priorities, null, 2));
      } else {
        console.log(formatPriorities(priorities));
      }
    });
}
