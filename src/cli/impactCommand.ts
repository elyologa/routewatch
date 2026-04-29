import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { assessImpact, formatImpactReport } from '../scanner/routeImpact';

export function registerImpactCommand(program: Command): void {
  program
    .command('impact')
    .description('Analyse which routes have the highest downstream impact')
    .option('-d, --dir <path>', 'Path to Next.js app directory')
    .option('-c, --config <path>', 'Path to routewatch config file')
    .option('--min-score <number>', 'Only show routes with score >= value', '0')
    .option('--level <level>', 'Filter by impact level (critical|high|medium|low)')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir
        ? path.resolve(opts.dir)
        : path.resolve(config.appDir ?? 'app');

      const root = await scanRoutes(appDir);
      const report = assessImpact(root);

      let entries = report.entries;

      const minScore = parseInt(opts.minScore, 10);
      if (minScore > 0) {
        entries = entries.filter((e) => e.score >= minScore);
      }

      if (opts.level) {
        entries = entries.filter((e) => e.level === opts.level);
      }

      if (opts.json) {
        console.log(JSON.stringify({ ...report, entries }, null, 2));
        return;
      }

      const filtered = { ...report, entries, totalRoutes: entries.length };
      console.log(formatImpactReport(filtered));
    });
}
