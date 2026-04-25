import { Command } from 'commander';
import * as path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { detectRedirects, formatRedirectReport, RedirectRule } from '../scanner/routeRedirect';

export function registerRedirectCommand(program: Command): void {
  program
    .command('redirects')
    .description('Detect and report redirect rules against scanned routes')
    .option('-d, --dir <path>', 'App directory to scan', 'app')
    .option('-c, --config <path>', 'Path to routewatch config file')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = path.resolve(opts.dir ?? config.appDir ?? 'app');

      let tree;
      try {
        tree = scanRoutes(appDir);
      } catch {
        console.error(`Error: Could not scan directory "${appDir}"`);
        process.exit(1);
      }

      const rules: RedirectRule[] = (config.redirects ?? []).map((r: any) => ({
        source: r.source,
        destination: r.destination,
        permanent: r.permanent ?? false,
      }));

      if (rules.length === 0) {
        console.warn('No redirect rules found in config. Add a "redirects" array to your routewatch config.');
      }

      const report = detectRedirects(tree, rules);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatRedirectReport(report));
      }
    });
}
