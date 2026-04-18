import fs from 'fs';
import path from 'path';
import { Report } from '../analyzer/deadRouteAnalyzer';
import { formatJson } from '../reporter/reportFormatter';

export type ExportFormat = 'json' | 'markdown' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  outputPath: string;
}

export function exportToMarkdown(report: Report): string {
  const lines: string[] = ['# RouteWatch Report', ''];
  lines.push(`**Total Routes:** ${report.totalRoutes}`);
  lines.push(`**Dead Routes:** ${report.deadRoutes.length}`);
  lines.push('');
  if (report.deadRoutes.length > 0) {
    lines.push('## Dead Routes', '');
    for (const r of report.deadRoutes) {
      lines.push(`- \`${r.path}\` — ${r.reason}`);
    }
  } else {
    lines.push('_No dead routes found._');
  }
  return lines.join('\n');
}

export function exportToCsv(report: Report): string {
  const rows = ['path,reason,segment'];
  for (const r of report.deadRoutes) {
    const seg = r.segment ?? '';
    rows.push(`"${r.path}","${r.reason}","${seg}"`);
  }
  return rows.join('\n');
}

export function exportReport(report: Report, options: ExportOptions): void {
  let content: string;
  switch (options.format) {
    case 'json':
      content = formatJson(report);
      break;
    case 'markdown':
      content = exportToMarkdown(report);
      break;
    case 'csv':
      content = exportToCsv(report);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
  const dir = path.dirname(options.outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(options.outputPath, content, 'utf-8');
}
