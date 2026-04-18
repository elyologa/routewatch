import { AnalysisReport, DeadRouteResult } from '../analyzer/deadRouteAnalyzer';

const RESET =\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

function colorize(text: string, color: string): string {
  return `${color}${text}${RESET}`;
}

export function formatDeadRoute(dead: DeadRouteResult): string {
  return `  ${colorize('✗', RED)} ${colorize(dead.path, BOLD)}  — ${dead.reason}`;
}

export function formatReport(report: AnalysisReport, useColor = true): string {
  const lines: string[] = [];

  const header = '=== RouteWatch Analysis Report ===';
  lines.push(useColor ? colorize(header, BOLD) : header);
  lines.push('');

  lines.push(`Total routes scanned : ${report.totalRoutes}`);
  lines.push(
    `Active routes        : ${
      useColor ? colorize(String(report.activeRoutes.length), GREEN) : report.activeRoutes.length
    }`
  );
  lines.push(
    `Dead routes          : ${
      useColor ? colorize(String(report.deadRoutes.length), report.deadRoutes.length > 0 ? RED : GREEN) : report.deadRoutes.length
    }`
  );

  if (report.deadRoutes.length > 0) {
    lines.push('');
    lines.push(useColor ? colorize('Dead Routes:', YELLOW) : 'Dead Routes:');
    report.deadRoutes.forEach((d) => {
      lines.push(useColor ? formatDeadRoute(d) : `  ✗ ${d.path}  — ${d.reason}`);
    });
  }

  lines.push('');
  return lines.join('\n');
}

export function formatJson(report: AnalysisReport): string {
  return JSON.stringify(report, null, 2);
}
