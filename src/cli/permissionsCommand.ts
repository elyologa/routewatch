import { Command } from 'commander';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { collectPermissions, formatPermissions, PermissionRule } from '../scanner/routePermissions';

export function registerPermissionsCommand(program: Command): void {
  program
    .command('permissions')
    .description('Show role-based permissions mapped to routes')
    .option('-d, --dir <path>', 'App directory to scan')
    .option('-c, --config <path>', 'Path to config file')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir ?? config.appDir ?? 'app';
      const rules: PermissionRule[] = (config as any).permissions ?? [];

      if (rules.length === 0) {
        console.warn('No permission rules defined in config.');
        return;
      }

      const tree = await scanRoutes(appDir);
      const entries = tree.flatMap(node => collectPermissions(node, rules));

      if ((config as any).json) {
        console.log(JSON.stringify(entries, null, 2));
      } else {
        console.log(formatPermissions(entries));
      }
    });
}
