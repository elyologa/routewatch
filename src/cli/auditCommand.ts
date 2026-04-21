import { Command } from 'commander';
import * as path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { auditRoutes, formatAuditReport } from '../scanner/routeAudit';
import { renderAuditReport } from '../visualizer/auditRenderer';

export function registerAuditCommand(program: Command): void {
  program
    .command('audit')
    .description('Audit the Next.js app router for structural issues')
    .option('-d, --dir <path>', 'Path to the Next.js app directory')
    .option('-c, --config <path>', 'Path to routewatch config file')
    .option('--json', 'Output results as JSON')
    .option('--fail-on-warning', 'Exit with code 1 if warnings are found')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = opts.dir
        ? path.resolve(opts.dir)
        : path.resolve(config.appDir ?? 'app');

      let root;
      try {
        root = scanRoutes(appDir);
      } catch (err) {
        console.error(`Failed to scan routes: ${(err as Error).message}`);
        process.exit(1);
      }

      const report = auditRoutes(root);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(renderAuditReport(report));
      }

      const hasErrors = report.failed > 0;
      const hasWarnings = report.issues.some((i) => i.severity === 'warning');

      if (hasErrors || (opts.failOnWarning && hasWarnings)) {
        process.exit(1);
      }
    });
}
