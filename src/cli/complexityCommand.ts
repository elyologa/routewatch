import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { analyzeComplexity, formatComplexityReport } from '../scanner/routeComplexity';

export function registerComplexityCommand(program: Command): void {
  program
    .command('complexity')
    .description('Analyse and report the complexity of each route in the app')
    .option('-d, --dir <path>', 'Path to the Next.js app directory')
    .option('-c, --config <path>', 'Path to routewatch config file')
    .option('--json', 'Output results as JSON')
    .option('--min-score <number>', 'Only show routes with score >= value', parseInt)
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

      const report = analyzeComplexity(root);

      const filtered =
        opts.minScore !== undefined
          ? { ...report, routes: report.routes.filter((r) => r.score >= opts.minScore) }
          : report;

      if (opts.json) {
        console.log(JSON.stringify(filtered, null, 2));
        return;
      }

      if (filtered.routes.length === 0) {
        console.log('No routes matched the given criteria.');
        return;
      }

      console.log(formatComplexityReport(filtered));
    });
}
