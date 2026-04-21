import { Command } from 'commander';
import * as path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { resolveConfig } from './config';
import { collectI18nRoutes, formatI18nReport } from '../scanner/routeI18n';
import { renderI18nReport } from '../visualizer/i18nRenderer';

export function registerI18nCommand(program: Command): void {
  program
    .command('i18n')
    .description('Audit i18n coverage across all routes')
    .option('-c, --config <path>', 'Path to config file')
    .option('--locales <locales>', 'Comma-separated list of locales', 'en')
    .option('--default-locale <locale>', 'Default locale', 'en')
    .option('--json', 'Output as JSON')
    .option('--plain', 'Output plain text without color')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = config.appDir
        ? path.resolve(config.appDir)
        : path.resolve(process.cwd(), 'app');

      const locales: string[] = (opts.locales as string)
        .split(',')
        .map((l: string) => l.trim())
        .filter(Boolean);

      const defaultLocale: string = opts.defaultLocale ?? 'en';

      const root = scanRoutes(appDir);
      if (!root) {
        console.error('No routes found in', appDir);
        process.exit(1);
      }

      const report = collectI18nRoutes(root, appDir, locales, defaultLocale);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      if (opts.plain) {
        console.log(formatI18nReport(report));
        return;
      }

      console.log(renderI18nReport(report));

      if (report.partiallyTranslated > 0) {
        process.exit(1);
      }
    });
}
