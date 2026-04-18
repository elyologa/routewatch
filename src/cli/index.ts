#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { findDeadRoutes, buildReport } from '../analyzer/deadRouteAnalyzer';
import { formatReport, formatJson } from '../reporter/reportFormatter';
import { resolveConfig } from './config';

const program = new Command();

program
  .name('routewatch')
  .description('Audit and visualize Next.js app router structure and dead routes')
  .version('0.1.0');

program
  .command('audit')
  .description('Scan app directory and report dead routes')
  .argument('[appDir]', 'Path to Next.js app directory', 'app')
  .option('-f, --format <format>', 'Output format: text or json', 'text')
  .option('-c, --config <path>', 'Path to routewatch config file')
  .option('--ignore <patterns...>', 'Route patterns to ignore')
  .action(async (appDir: string, options) => {
    const config = resolveConfig(options.config, options.ignore);
    const resolvedDir = path.resolve(process.cwd(), appDir);

    try {
      const routeTree = scanRoutes(resolvedDir);
      const deadRoutes = findDeadRoutes(routeTree, config.ignore);
      const report = buildReport(routeTree, deadRoutes);

      if (options.format === 'json') {
        console.log(formatJson(report));
      } else {
        console.log(formatReport(report));
      }

      if (deadRoutes.length > 0) {
        process.exit(1);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(2);
    }
  });

program.parse();
