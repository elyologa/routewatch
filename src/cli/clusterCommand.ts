import { Command } from 'commander';
import { resolveConfig } from './config';
import { scanRoutes } from '../scanner/routeScanner';
import { clusterRoutes } from '../scanner/routeCluster';
import { renderClusterReport } from '../visualizer/clusterRenderer';
import { formatClusterReport } from '../scanner/routeCluster';

export function registerClusterCommand(program: Command): void {
  program
    .command('cluster')
    .description('Group routes into clusters by URL prefix depth')
    .option('-d, --depth <number>', 'Prefix depth for clustering', '1')
    .option('--json', 'Output as JSON')
    .option('--plain', 'Plain text output without colors')
    .option('-c, --config <path>', 'Path to config file')
    .action(async (opts) => {
      try {
        const config = await resolveConfig(opts.config);
        const appDir = config.appDir ?? 'app';
        const depth = parseInt(opts.depth, 10);

        const tree = await scanRoutes(appDir);
        const report = clusterRoutes(tree, depth);

        if (opts.json) {
          console.log(JSON.stringify(report, null, 2));
          return;
        }

        if (opts.plain) {
          console.log(formatClusterReport(report));
          return;
        }

        console.log(renderClusterReport(report));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`cluster error: ${msg}`);
        process.exit(1);
      }
    });
}
