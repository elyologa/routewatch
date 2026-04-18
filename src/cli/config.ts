import fs from 'fs';
import path from 'path';

export interface RouteWatchConfig {
  ignore: string[];
}

const DEFAULT_CONFIG: RouteWatchConfig = {
  ignore: [],
};

const CONFIG_FILE_NAMES = ['routewatch.config.json', '.routewatchrc'];

function loadConfigFile(configPath: string): Partial<RouteWatchConfig> {
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as Partial<RouteWatchConfig>;
}

function findConfigFile(): string | null {
  for (const name of CONFIG_FILE_NAMES) {
    const candidate = path.resolve(process.cwd(), name);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function resolveConfig(
  explicitPath?: string,
  cliIgnore?: string[]
): RouteWatchConfig {
  let fileConfig: Partial<RouteWatchConfig> = {};

  const configPath = explicitPath
    ? path.resolve(process.cwd(), explicitPath)
    : findConfigFile();

  if (configPath) {
    try {
      fileConfig = loadConfigFile(configPath);
    } catch {
      console.warn(`Warning: could not parse config file at ${configPath}`);
    }
  }

  return {
    ignore: [
      ...(DEFAULT_CONFIG.ignore),
      ...(fileConfig.ignore ?? []),
      ...(cliIgnore ?? []),
    ],
  };
}
