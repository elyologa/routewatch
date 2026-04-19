import { resolve } from 'path';
import { startWatcher } from '../scanner/routeWatcher';
import { visualize } from '../visualizer';
import { findDeadRoutes, buildReport } from '../analyzer/deadRouteAnalyzer';
import { ResolvedConfig } from './config';

export function runWatchCommand(config: ResolvedConfig): void {
  const appDir = resolve(config.appDir);

  console.log(`[routewatch] Watching ${appDir} for changes...\n`);

  const refresh = (label: string) => {
    console.clear();
    console.log(`[routewatch] Route update detected (${label})\n`);
    try {
      const { scanRoutes } = require('../scanner/routeScanner');
      const root = scanRoutes(appDir);
      visualize(root, config);

      if (config.detectDead) {
        printDeadRoutesSummary(root);
      }
    } catch (err) {
      console.error('[routewatch] Error scanning routes:', (err as Error).message);
    }
  };

  refresh('initial');

  startWatcher({ appDir, debounceMs: 300 }, () => refresh('change'));
}

/**
 * Finds dead routes from the scanned route tree and prints a summary to stdout.
 */
function printDeadRoutesSummary(root: unknown): void {
  const dead = findDeadRoutes(root);
  const report = buildReport(dead);
  if (report.deadRoutes.length === 0) {
    console.log('\n✓ No dead routes detected.');
  } else {
    console.log(`\n⚠ ${report.deadRoutes.length} dead route(s) found.`);
    report.deadRoutes.forEach((r) => console.log('  -', r.path));
  }
}
