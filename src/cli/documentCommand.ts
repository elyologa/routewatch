import { Command } from "commander";
import path from "path";
import { scanRoutes } from "../scanner/routeScanner";
import { resolveConfig } from "./config";
import { documentRoutes, formatDocs } from "../scanner/routeDocumenter";

export function registerDocumentCommand(program: Command): void {
  program
    .command("document")
    .description("Generate documentation for all routes in the Next.js app")
    .option("-d, --dir <dir>", "App directory", "app")
    .option("-c, --config <config>", "Config file path")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      const config = await resolveConfig(opts.config);
      const appDir = path.resolve(opts.dir ?? config.appDir ?? "app");

      let root;
      try {
        root = scanRoutes(appDir);
      } catch {
        console.error(`Error: could not scan directory "${appDir}"`);
        process.exit(1);
      }

      const docs = documentRoutes(root);

      if (docs.length === 0) {
        console.log("No routes found.");
        return;
      }

      if (opts.json) {
        console.log(JSON.stringify(docs, null, 2));
      } else {
        console.log(`Found ${docs.length} route(s):\n`);
        console.log(formatDocs(docs));
      }
    });
}
