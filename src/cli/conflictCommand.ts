import { Command } from 'commander';
import path from 'path';
import { resolveConfig } from './config';
import { scanRoutes } from '../scanner/routeScanner';
import { checkRouteConflicts, formatConflictReport } from '../scanner/routeConflict';

export function registerConflictCommand(program: Command): void {
  program
    .command('conflict')
    .description('Detect conflicting dynamic routes that resolve to the same URL pattern')
    .option('-d, --dir <path>', 'Path to Next.js app directory')
    .option('-c, --config <path>', 'Path to routewatch config file')
    .option('--json', 'Output results as JSON')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir ?? config.appDir ?? path.join(process.cwd(), 'app');

      let root;
      try {
        root = scanRoutes(appDir);
      } catch {
        console.error(`Error: Could not scan directory "${appDir}"`);
        process.exit(1);
      }

      const report = checkRouteConflicts(root);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        process.stdout.write(formatConflictReport(report));
      }

      if (report.total > 0) process.exit(1);
    });
}
