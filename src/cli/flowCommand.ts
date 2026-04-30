import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { analyzeFlow, formatFlowReport } from '../scanner/routeFlow';
import { renderFlowReport } from '../visualizer/flowRenderer';

export function registerFlowCommand(program: Command): void {
  program
    .command('flow')
    .description('Visualize the navigation flow graph of your Next.js app routes')
    .option('-d, --dir <path>', 'Path to the Next.js app directory')
    .option('-c, --config <path>', 'Path to routewatch config file')
    .option('--json', 'Output raw JSON report')
    .option('--plain', 'Output plain text without colors')
    .option('--limit <number>', 'Max edges to display', '30')
    .action(async (opts) => {
      try {
        const config = await resolveConfig(opts.config);
        const appDir = opts.dir
          ? path.resolve(opts.dir)
          : path.resolve(config.appDir ?? 'app');

        const root = await scanRoutes(appDir);
        const report = analyzeFlow(root);

        if (opts.json) {
          console.log(JSON.stringify(report, null, 2));
          return;
        }

        if (opts.plain) {
          console.log(formatFlowReport(report));
          return;
        }

        const limit = parseInt(opts.limit, 10);
        console.log(renderFlowReport({ ...report, graph: { ...report.graph, edges: report.graph.edges.slice(0, limit) } }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
