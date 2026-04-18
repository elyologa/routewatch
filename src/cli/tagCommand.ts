import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { tagRoutes, formatTagged, TagRule } from '../scanner/routeTaggar';

export function registerTagCommand(program: Command): void {
  program
    .command('tag')
    .description('Tag routes based on pattern rules from config')
    .option('-d, --dir <dir>', 'App directory', 'app')
    .option('-c, --config <config>', 'Config file path')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = path.resolve(opts.dir);
      const root = scanRoutes(appDir);
      const rules: TagRule[] = (config.tags as TagRule[]) ?? [];

      if (rules.length === 0) {
        console.warn('No tag rules defined in config.');
        return;
      }

      const tagged = tagRoutes(root, rules);

      if (opts.json) {
        console.log(JSON.stringify(tagged, null, 2));
      } else {
        process.stdout.write(formatTagged(tagged));
      }
    });
}
