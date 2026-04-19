import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { scanRoutes } from '../scanner/routeScanner';
import { exportRoutes } from '../scanner/routeExporter';
import { resolveConfig } from './config';

export function registerExportRoutesCommand(program: Command): void {
  program
    .command('export-routes')
    .description('Export flat list of all routes as JSON or CSV')
    .option('-d, --dir <dir>', 'App directory to scan')
    .option('-f, --format <format>', 'Output format: json or csv', 'json')
    .option('-o, --out <file>', 'Output file (default: stdout)')
    .option('-c, --config <file>', 'Config file path')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir ?? config.appDir ?? path.join(process.cwd(), 'app');

      if (!fs.existsSync(appDir)) {
        console.error(`Directory not found: ${appDir}`);
        process.exit(1);
      }

      const root = scanRoutes(appDir);
      const routes = exportRoutes(root);

      let output: string;

      if (opts.format === 'csv') {
        const header = 'path,depth,isDynamic,isCatchAll,hasPage,hasLayout';
        const rows = routes.map(
          (r) =>
            `${r.path},${r.depth},${r.isDynamic},${r.isCatchAll},${r.hasPage},${r.hasLayout}`
        );
        output = [header, ...rows].join('\n');
      } else {
        output = JSON.stringify(routes, null, 2);
      }

      if (opts.out) {
        fs.writeFileSync(opts.out, output, 'utf-8');
        console.log(`Exported ${routes.length} routes to ${opts.out}`);
      } else {
        console.log(output);
      }
    });
}
