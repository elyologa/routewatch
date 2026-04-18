import * as fs from 'fs';
import * as path from 'path';

export interface RouteMetadata {
  routePath: string;
  filePath: string;
  hasLayout: boolean;
  hasLoading: boolean;
  hasError: boolean;
  hasNotFound: boolean;
  isDynamic: boolean;
  isCatchAll: boolean;
  isParallelRoute: boolean;
  depth: number;
}

const SPECIAL_FILES = ['layout', 'loading', 'error', 'not-found'] as const;

function hasSpecialFile(dir: string, name: string): boolean {
  return ['tsx', 'ts', 'jsx', 'js'].some((ext) =>
    fs.existsSync(path.join(dir, `${name}.${ext}`))
  );
}

export function extractMetadata(routePath: string, absDir: string): RouteMetadata {
  const segments = routePath.split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? '';

  return {
    routePath,
    filePath: absDir,
    hasLayout: hasSpecialFile(absDir, 'layout'),
    hasLoading: hasSpecialFile(absDir, 'loading'),
    hasError: hasSpecialFile(absDir, 'error'),
    hasNotFound: hasSpecialFile(absDir, 'not-found'),
    isDynamic: /\[(?!\.\.\.)/.test(last),
    isCatchAll: /\[\.\.\..+\]/.test(last),
    isParallelRoute: last.startsWith('@'),
    depth: segments.length,
  };
}

export function collectMetadata(
  routes: Array<{ path: string; absDir: string }>
): RouteMetadata[] {
  return routes.map((r) => extractMetadata(r.path, r.absDir));
}
