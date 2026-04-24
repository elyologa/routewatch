import { SimilarityReport, SimilarPair } from '../scanner/routeSimilarity';

function scoreBar(score: number): string {
  const filled = Math.round(score * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function colorScore(score: number): string {
  if (score >= 0.95) return `\x1b[31m${(score * 100).toFixed(0)}%\x1b[0m`;
  if (score >= 0.85) return `\x1b[33m${(score * 100).toFixed(0)}%\x1b[0m`;
  return `\x1b[32m${(score * 100).toFixed(0)}%\x1b[0m`;
}

function renderPair(pair: SimilarPair, index: number): string {
  const bar = scoreBar(pair.score);
  const pct = colorScore(pair.score);
  return [
    `  ${index + 1}. ${pair.a}`,
    `     ↔ ${pair.b}`,
    `     [${bar}] ${pct} — ${pair.reason}`,
  ].join('\n');
}

export function buildSimilaritySummary(
  report: SimilarityReport
): Record<string, number> {
  const buckets: Record<string, number> = { high: 0, medium: 0, low: 0 };
  for (const p of report.pairs) {
    if (p.score >= 0.95) buckets.high++;
    else if (p.score >= 0.85) buckets.medium++;
    else buckets.low++;
  }
  return buckets;
}

export function renderSimilarityReport(report: SimilarityReport): string {
  if (report.total === 0) {
    return '\x1b[32m✔ No similar routes detected.\x1b[0m\n';
  }

  const summary = buildSimilaritySummary(report);
  const lines: string[] = [
    `\x1b[1mSimilar Routes Report\x1b[0m — ${report.total} pair(s) found`,
    `  High similarity : ${summary.high}`,
    `  Medium          : ${summary.medium}`,
    `  Low             : ${summary.low}`,
    '',
  ];

  report.pairs.forEach((pair, i) => {
    lines.push(renderPair(pair, i));
    lines.push('');
  });

  return lines.join('\n');
}
