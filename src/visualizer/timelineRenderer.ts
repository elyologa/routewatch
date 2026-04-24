import type { TimelineReport, TimelineEntry } from '../scanner/routeTimeline';

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';

function ageColor(days: number | null): string {
  if (days === null) return DIM;
  if (days <= 30) return GREEN;
  if (days <= 180) return YELLOW;
  return RED;
}

function bar(days: number | null, max: number, width = 20): string {
  if (days === null || max === 0) return DIM + '-'.repeat(width) + RESET;
  const filled = Math.round((days / max) * width);
  return ageColor(days) + '█'.repeat(filled) + DIM + '░'.repeat(width - filled) + RESET;
}

export function renderTimelineEntry(entry: TimelineEntry, maxAge: number): string {
  const age = entry.ageInDays !== null ? `${entry.ageInDays}d` : '?';
  const col = ageColor(entry.ageInDays);
  const b = bar(entry.ageInDays, maxAge);
  return `  ${CYAN}${entry.route.padEnd(38)}${RESET} ${b} ${col}${age.padStart(6)}${RESET}`;
}

export function buildTimelineSummary(report: TimelineReport): string {
  const lines: string[] = [];
  if (report.oldest) lines.push(`  Oldest : ${YELLOW}${report.oldest.route}${RESET} (${report.oldest.ageInDays}d)`);
  if (report.newest) lines.push(`  Newest : ${GREEN}${report.newest.route}${RESET} (${report.newest.ageInDays}d)`);
  if (report.averageAgeInDays !== null) lines.push(`  Avg age: ${report.averageAgeInDays}d`);
  return lines.join('\n');
}

export function renderTimelineReport(report: TimelineReport): string {
  const maxAge = report.entries.reduce((m, e) => Math.max(m, e.ageInDays ?? 0), 0);
  const lines: string[] = [
    `${CYAN}Route Timeline${RESET}`,
    `${'─'.repeat(70)}`,
  ];
  for (const entry of report.entries) {
    lines.push(renderTimelineEntry(entry, maxAge));
  }
  lines.push(`${'─'.repeat(70)}`);
  lines.push(buildTimelineSummary(report));
  return lines.join('\n');
}
