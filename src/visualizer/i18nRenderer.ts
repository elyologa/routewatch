import { I18nReport, I18nRouteInfo } from '../scanner/routeI18n';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';

function colorize(text: string, color: string): string {
  return `${color}${text}${RESET}`;
}

export function buildI18nSummary(report: I18nReport): string {
  const total = report.routes.length;
  const pct =
    total === 0 ? 100 : Math.round((report.fullyTranslated / total) * 100);
  return [
    colorize(`I18n Summary`, BOLD),
    `  Locales tracked : ${report.allLocales.join(', ')}`,
    `  Total routes    : ${total}`,
    `  Fully translated: ${colorize(String(report.fullyTranslated), GREEN)}`,
    `  Partial         : ${colorize(String(report.partiallyTranslated), YELLOW)}`,
    `  Coverage        : ${pct >= 80 ? colorize(`${pct}%`, GREEN) : colorize(`${pct}%`, RED)}`,
  ].join('\n');
}

export function renderI18nRoute(info: I18nRouteInfo): string {
  if (info.missingLocales.length === 0) {
    return `  ${colorize('✓', GREEN)} ${info.routePath}`;
  }
  const missing = colorize(`[${info.missingLocales.join(', ')}]`, RED);
  return `  ${colorize('✗', RED)} ${info.routePath}  missing: ${missing}`;
}

export function renderI18nReport(report: I18nReport): string {
  const lines: string[] = [buildI18nSummary(report), ''];

  const incomplete = report.routes.filter((r) => r.missingLocales.length > 0);
  const complete = report.routes.filter((r) => r.missingLocales.length === 0);

  if (incomplete.length > 0) {
    lines.push(colorize('Incomplete translations:', YELLOW));
    for (const route of incomplete) {
      lines.push(renderI18nRoute(route));
    }
    lines.push('');
  }

  if (complete.length > 0) {
    lines.push(colorize('Fully translated routes:', GREEN));
    for (const route of complete) {
      lines.push(renderI18nRoute(route));
    }
  }

  return lines.join('\n');
}
