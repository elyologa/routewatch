import chalk from "chalk";
import { RouteGroup } from "../scanner/routeGrouper";

function formatRoute(path: string, isDead: boolean): string {
  const icon = isDead ? chalk.red("✗") : chalk.green("✓");
  const label = isDead ? chalk.red(path) : chalk.white(path);
  return `  ${icon} ${label}`;
}

function formatPrefix(prefix: string): string {
  return prefix === "*" ? chalk.yellow("(ungrouped)") : chalk.cyan.bold(prefix);
}

export function renderGroup(group: RouteGroup): string {
  const header = formatPrefix(group.prefix);

  const lines = [header];
  for (const route of group.routes) {
    lines.push(formatRoute(route.path, route.isDead));
  }
  return lines.join("\n");
}

export function renderGroups(groups: RouteGroup[]): string {
  if (groups.length === 0) return chalk.gray("No route groups to display.");

  const sections = groups.map((g) => renderGroup(g));
  const divider = chalk.gray("─".repeat(40));

  return sections.join("\n" + divider + "\n");
}

export function renderGroupSummary(groups: RouteGroup[]): string {
  const lines = [chalk.bold("Group Summary:")];
  for (const group of groups) {
    const total = group.routes.length;
    const dead = group.routes.filter((r) => r.isDead).length;
    const prefix = group.prefix === "*" ? "(ungrouped)" : group.prefix;
    lines.push(
      `  ${chalk.cyan(prefix)}: ${total} route(s), ${
        dead > 0 ? chalk.red(`${dead} dead`) : chalk.green("none dead")
      }`
    );
  }
  return lines.join("\n");
}
