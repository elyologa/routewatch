import * as path from 'path';
import type { Command } from 'commander';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { analyzeFrequency, formatFrequencyReport } from '../scanner/routeFrequency';

export function registerFrequencyCommand(program: Command): void {
  program
    .command('frequency')
    .description('Analyze how frequently each route is referenced across the codebase')
    .option('-d, --dir <path>', 'Path to Next.js app directory')
    .option('-s, --src <path>', 'Source directory to scan for references', 'src')
    .option('--json', 'Output as JSON')
    .option('--min <n>', 'Only show routes with at least N references', '0')
    .action(async (opts) => {
      const config = await resolveConfig(opts);
      const appDir = opts.dir ?? config.appDir ?? 'app';
      const srcDir = path.resolve(opts.src);

      const tree = await scanRoutes(path.resolve(appDir));
      const report = analyzeFrequency(tree, srcDir);

      const minRefs = parseInt(opts.min, 10);
      const filtered = {
        ...report,
        entries: report.entries.filter(e => e.referenceCount >= minRefs),
      };

      if (opts.json) {
        console.log(JSON.stringify(filtered, null, 2));
        return;
      }

      console.log(formatFrequencyReport(filtered));

      if (filtered.unreferenced > 0) {
        console.log(`\n⚠️  ${filtered.unreferenced} route(s) have no references — consider removing them.`);
      }
    });
}
