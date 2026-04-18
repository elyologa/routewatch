import { Command } from 'commander';
import { resolveConfig } from './config';
import { scanRoutes } from '../scanner/routeScanner';
import { searchRoutes } from '../scanner/routeSearch';
import { colorize } from '../reporter/reportFormatter';

export function registerSearchCommand(program: Command): void {
  program
    .command('search <query>')
    .description('Search for routes matching a query string')
    .option('--segment', 'Match against segment name only', false)
    .option('--case-sensitive', 'Enable case-sensitive matching', false)
    .option('--dir <dir>', 'App directory to scan')
    .action(async (query: string, opts) => {
      try {
        const config = await resolveConfig({ appDir: opts.dir });
        const root = await scanRoutes(config.appDir);
        const results = searchRoutes(root, query, {
          matchSegment: opts.segment,
          caseSensitive: opts.caseSensitive,
        });

        if (results.length === 0) {
          console.log(colorize('yellow', `No routes found matching "${query}"`));
          return;
        }

        console.log(colorize('cyan', `Found ${results.length} route(s) matching "${query}":\n`));
        for (const result of results) {
          const score = result.score === 2 ? colorize('green', '[exact]') : colorize('gray', '[partial]');
          console.log(`  ${score} ${result.path}`);
        }
      } catch (err) {
        console.error(colorize('red', `Error: ${(err as Error).message}`));
        process.exit(1);
      }
    });
}
