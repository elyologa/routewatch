import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { detectSimilarRoutes, formatSimilarityReport } from '../scanner/routeSimilarity';
import { renderSimilarityReport } from '../visualizer/similarityRenderer';

export function registerSimilarityCommand(program: Command): void {
  program
    .command('similarity')
    .description('Detect structurally similar or near-duplicate routes')
    .option('-d, --dir <path>', 'Path to Next.js app directory')
    .option('-t, --threshold <number>', 'Similarity threshold (0-1)', '0.8')
    .option('--json', 'Output as JSON')
    .option('--plain', 'Output plain text without colors')
    .action(async (opts) => {
      const config = await resolveConfig(opts);
      const appDir = opts.dir
        ? path.resolve(opts.dir)
        : path.resolve(config.appDir ?? 'app');

      const threshold = parseFloat(opts.threshold);
      if (isNaN(threshold) || threshold < 0 || threshold > 1) {
        console.error('Error: --threshold must be a number between 0 and 1');
        process.exit(1);
      }

      let root;
      try {
        root = await scanRoutes(appDir);
      } catch (err) {
        console.error(`Error scanning routes: ${(err as Error).message}`);
        process.exit(1);
      }

      const report = detectSimilarRoutes(root, threshold);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      if (opts.plain) {
        process.stdout.write(formatSimilarityReport(report));
        return;
      }

      process.stdout.write(renderSimilarityReport(report));
    });
}
