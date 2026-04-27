import { Command } from 'commander';
import path from 'path';
import { resolveConfig } from './config';
import { scanRoutes } from '../scanner/routeScanner';
import { groupByNamespace, formatNamespaceReport } from '../scanner/routeNamespace';

export function registerNamespaceCommand(program: Command): void {
  program
    .command('namespace')
    .description('Group and display routes by top-level namespace')
    .option('-d, --dir <path>', 'Path to Next.js app directory')
    .option('-c, --config <path>', 'Path to routewatch config file')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir
        ? path.resolve(opts.dir)
        : path.resolve(config.appDir ?? 'app');

      let root;
      try {
        root = scanRoutes(appDir);
      } catch {
        console.error(`Error: could not scan directory "${appDir}"`);
        process.exit(1);
      }

      const report = groupByNamespace(root);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      console.log(formatNamespaceReport(report));

      if (report.groups.length === 0) {
        console.log('No namespaces detected.');
      }
    });
}
