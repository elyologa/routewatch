import { scanRoutes } from '../scanner/routeScanner';
import { validateRoutes, ValidationIssue } from '../scanner/routeValidator';
import { ResolvedConfig } from './config';

function formatIssue(issue: ValidationIssue): string {
  const icon =
    issue.type === 'missing-page'
      ? '⚠️'
      : issue.type === 'conflict'
      ? '🔀'
      : '❌';
  return `  ${icon} [${issue.type}] ${issue.route}\n     ${issue.message}`;
}

export async function runValidateCommand(
  config: ResolvedConfig,
  options: { json?: boolean } = {}
): Promise<number> {
  const root = await scanRoutes(config.appDir);
  const result = validateRoutes(root);

  if (options.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return result.valid ? 0 : 1;
  }

  if (result.valid) {
    console.log('✅ No validation issues found.');
    return 0;
  }

  console.log(`\n🔍 Found ${result.issues.length} issue(s):\n`);
  for (const issue of result.issues) {
    console.log(formatIssue(issue));
  }
  console.log();
  return 1;
}
