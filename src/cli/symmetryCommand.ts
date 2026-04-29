import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { detectSymmetry, formatSymmetryReport } from '../scanner/routeSymmetry';

export function registerSymmetryCommand(program: Command): void {
  program
    .command('symmetry')
    .description('Detect symmetric and asymmetric route pairs in your Next.js app')
    .option('-d, --dir <path>', 'Path to the Next.js app directory')
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
      } catch (err) {
        console.error(`Failed to scan routes in: ${appDir}`);
        process.exit(1);
      }

      const report = detectSymmetry(root);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      console.log(formatSymmetryReport(report));

      if (report.pairs.length === 0) {
        process.exit(0);
      }
    });
}
