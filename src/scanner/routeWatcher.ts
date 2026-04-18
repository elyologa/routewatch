import { watch, FSWatcher } from 'fs';
import { resolve } from 'path';
import { scanRoutes } from './routeScanner';
import { RouteNode } from '../types';

export type WatchCallback = (routes: RouteNode) => void;

export interface WatchOptions {
  appDir: string;
  debounceMs?: number;
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function startWatcher(
  options: WatchOptions,
  onChange: WatchCallback
): FSWatcher {
  const { appDir, debounceMs = 300 } = options;
  const absDir = resolve(appDir);

  const handleChange = debounce(() => {
    try {
      const routes = scanRoutes(absDir);
      onChange(routes);
    } catch (err) {
      console.error('[routewatch] Error rescanning routes:', err);
    }
  }, debounceMs);

  const watcher = watch(absDir, { recursive: true }, (event, filename) => {
    if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts'))) {
      handleChange();
    }
  });

  return watcher;
}
