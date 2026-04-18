import { Command } from 'commander';
import { scanRoutes } from '../scanner/routeScanner';
import { annotateRoutes, RouteAnnotation } from '../scanner/routeAnnotator';
import * as path from 'path';

function formatAnnotation(a: RouteAnnotation): string {
  const tags: string[] = [];
  if (a.dynamic) tags.push('dynamic');
  if (a.catchAll) tags.push('catch-all');
  if (a.optional) tags.push('optional');
  if (a.group) tags.push('group');
  if (a.parallel) tags.push('parallel');
  if (a.intercepted) tags.push('intercepted');
  const tagStr = tags.length ? ` [${tags.join(', ')}]` : '';
  return `  ${'  '.repeat(a.depth)}${a.route}${tagStr}`;
}

export function registerAnnotateCommand(program: Command): void {
  program
    .command('annotate')
    .description('Annotate each route with its type and properties')
    .argument('[appDir]', 'Path to Next.js app directory', 'app')
    .option('--json', 'Output as JSON')
    .action((appDir: string, options: { json?: boolean }) => {
      const resolved = path.resolve(process.cwd(), appDir);
      const root = scanRoutes(resolved);
      const annotations = annotateRoutes(root);

      if (options.json) {
        console.log(JSON.stringify(annotations, null, 2));
        return;
      }

      if (annotations.length === 0) {
        console.log('No routes found.');
        return;
      }

      console.log(`\nRoute Annotations (${annotations.length} routes):\n`);
      for (const a of annotations) {
        console.log(formatAnnotation(a));
      }
      console.log();
    });
}
