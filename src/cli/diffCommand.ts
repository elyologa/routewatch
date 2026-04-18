import * as fs from 'fs';
import * as path from 'path';
import { scanRoutes } from '../scanner/routeScanner';
import { compareRoutes, formatDiff } from '../scanner/routeComparator';
import { ResolvedConfig } from './config';

export interface DiffCommandOptions {
  snapshotPath?: string;
  save?: boolean;
}

const DEFAULT_SNAPSHOT = '.routewatch-snapshot.json';

export async function runDiffCommand(
  config: ResolvedConfig,
  options: DiffCommandOptions = {}
): Promise<void> {
  const snapshotFile = options.snapshotPath ?? DEFAULT_SNAPSHOT;
  const current = await scanRoutes(config.appDir);

  if (!fs.existsSync(snapshotFile)) {
    console.log('No snapshot found. Saving current routes as baseline.');
    fs.writeFileSync(snapshotFile, JSON.stringify(current, null, 2));
    return;
  }

  const raw = fs.readFileSync(snapshotFile, 'utf-8');
  const previous = JSON.parse(raw);
  const diff = compareRoutes(previous, current);

  console.log(formatDiff(diff));
  console.log(`\nSummary: +${diff.added.length} added, -${diff.removed.length} removed, ${diff.unchanged.length} unchanged`);

  if (options.save) {
    fs.writeFileSync(snapshotFile, JSON.stringify(current, null, 2));
    console.log(`Snapshot updated at ${path.resolve(snapshotFile)}`);
  }
}
