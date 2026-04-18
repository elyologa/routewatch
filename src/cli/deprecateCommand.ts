import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { collectDeprecated, formatDeprecated, DeprecationRule } from '../scanner/routeDeprecator';

export function registerDeprecateCommand(program: Command): void {
  program
    .command('deprecate')
    .description('List routes matching deprecation rules from config')
    .option('-d, --dir <dir>', 'App directory', 'app')
    .option('-c, --config <config>', 'Config file path')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = path.resolve(opts.dir ?? config.appDir ?? 'app');
      const rules: DeprecationRule[] = (config as any).deprecations ?? [];

      if (rules.length === 0) {
        console.log('No deprecation rules configured.');
        return;
      }

      const tree = await scanRoutes(appDir);
      const deprecated = collectDeprecated(tree, rules);

      if (opts.json) {
        console.log(JSON.stringify(deprecated, null, 2));
      } else {
        console.log(`\nDeprecated Routes (${deprecated.length}):\n`);
        console.log(formatDeprecated(deprecated));
      }
    });
}
