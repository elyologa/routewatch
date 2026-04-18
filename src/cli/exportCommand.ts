import path from 'path';
import { ResolvedConfig } from './config';
import { scanRoutes } from '../scanner/routeScanner';
import { buildReport } from '../analyzer/deadRouteAnalyzer';
import { exportReport, ExportFormat } from '../exporter/reportExporter';

export interface ExportCommandOptions {
  format?: string;
  output?: string;
}

export async function runExportCommand(
  config: ResolvedConfig,
  options: ExportCommandOptions
): Promise<void> {
  const format = (options.format ?? 'json') as ExportFormat;
  const validFormats: ExportFormat[] = ['json', 'markdown', 'csv'];
  if (!validFormats.includes(format)) {
    throw new Error(`Invalid format "${format}". Choose from: ${validFormats.join(', ')}`);
  }

  const ext = format === 'markdown' ? 'md' : format;
  const outputPath = options.output
    ? path.resolve(options.output)
    : path.resolve(process.cwd(), `routewatch-report.${ext}`);

  const routeTree = scanRoutes(config.appDir);
  const report = buildReport(routeTree);

  exportReport(report, { format, outputPath });

  console.log(`Report exported to ${outputPath} (${format})`);
}
