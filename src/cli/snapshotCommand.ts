import { Command } from 'commander';
import path from 'path';
import { resolveConfig } from './config';
import { scanRoutes } from '../scanner/routeScanner';
import {
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  diffSnapshots,
} from '../scanner/routeSnapshot';

export function registerSnapshotCommand(program: Command): void {
  const cmd = program.command('snapshot').description('Manage route snapshots');

  cmd
    .command('save')
    .description('Save current route snapshot')
    .option('--config <path>', 'Config file path')
    .option('--out <path>', 'Output file', '.routewatch/snapshot.json')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const tree = await scanRoutes(config.appDir);
      const snapshot = createSnapshot(tree);
      const outPath = path.resolve(opts.out);
      saveSnapshot(snapshot, outPath);
      console.log(`Snapshot saved to ${outPath} (${snapshot.paths.length} routes)`);
    });

  cmd
    .command('diff')
    .description('Diff current routes against a saved snapshot')
    .option('--config <path>', 'Config file path')
    .option('--snapshot <path>', 'Snapshot file', '.routewatch/snapshot.json')
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const tree = await scanRoutes(config.appDir);
      const current = createSnapshot(tree);
      const snapshotPath = path.resolve(opts.snapshot);
      let before;
      try {
        before = loadSnapshot(snapshotPath);
      } catch {
        console.error(`Could not load snapshot from ${snapshotPath}`);
        process.exit(1);
      }
      const diff = diffSnapshots(before, current);
      if (diff.added.length === 0 && diff.removed.length === 0) {
        console.log('No route changes detected.');
        return;
      }
      if (diff.added.length) {
        console.log('\nAdded routes:');
        diff.added.forEach((r) => console.log(`  + ${r}`));
      }
      if (diff.removed.length) {
        console.log('\nRemoved routes:');
        diff.removed.forEach((r) => console.log(`  - ${r}`));
      }
    });
}
