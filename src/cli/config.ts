import fs from 'fs';
import path from 'path';
import { FilterOptions } from '../scanner/routeFilter';

export interface RouteWatchConfig {
  appDir?: string;
  output?: 'text' | 'json';
  filter?: FilterOptions;
  ignore?: string[];
}

const CONFIG_FILENAMES = [
  'routewatch.config.json',
  'routewatch.config.js',
  '.routewatchrc',
];

export function findConfigFile(cwd: string = process.cwd()): string | null {
  for (const name of CONFIG_FILENAMES) {
    const candidate = path.join(cwd, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function loadConfigFile(filePath: string): RouteWatchConfig {
  const ext = path.extname(filePath);
  if (ext === '.js') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(filePath) as RouteWatchConfig;
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as RouteWatchConfig;
}

export function resolveConfig(
  cliArgs: Partial<RouteWatchConfig> = {},
  cwd: string = process.cwd()
): RouteWatchConfig {
  const configPath = findConfigFile(cwd);
  const fileConfig: RouteWatchConfig = configPath ? loadConfigFile(configPath) : {};

  return {
    appDir: cliArgs.appDir ?? fileConfig.appDir ?? path.join(cwd, 'app'),
    output: cliArgs.output ?? fileConfig.output ?? 'text',
    filter: {
      ...(fileConfig.filter ?? {}),
      ...(cliArgs.filter ?? {}),
      excludePatterns: [
        ...(fileConfig.filter?.excludePatterns ?? []),
        ...(cliArgs.filter?.excludePatterns ?? []),
        ...(fileConfig.ignore ?? []),
        ...(cliArgs.ignore ?? []),
      ],
    },
  };
}
