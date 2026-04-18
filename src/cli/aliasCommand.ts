import { Command } from "commander";
import path from "path";
import { scanRoutes } from "../scanner/routeScanner";
import { resolveConfig } from "./config";
import {
  collectPaths,
  applyAliases,
  resolveAlias,
  formatAliases,
} from "../scanner/routeAliaser";

export function registerAliasCommand(program: Command): void {
  program
    .command("alias")
    .description("Show or resolve route aliases defined in config")
    .option("-c, --config <path>", "path to config file")
    .option("-r, --resolve <alias>", "resolve a specific alias to its route")
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = path.resolve(config.appDir ?? "app");
      const tree = scanRoutes(appDir);
      const aliases: Record<string, string> = config.aliases ?? {};

      if (opts.resolve) {
        const resolved = resolveAlias(opts.resolve, aliases);
        if (resolved) {
          console.log(`${opts.resolve}  →  ${resolved}`);
        } else {
          console.log(`No route found for alias: ${opts.resolve}`);
        }
        return;
      }

      const paths = collectPaths(tree);
      const mapped = applyAliases(paths, aliases);
      console.log(formatAliases(mapped));
    });
}
