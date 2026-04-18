import { RouteNode } from '../scanner/routeScanner';

export interface DeadRouteResult {
  path: string;
  reason: string;
}

export interface AnalysisReport {
  totalRoutes: number;
  deadRoutes: DeadRouteResult[];
  activeRoutes: string[];
}

/**
 * Determines if a route node is considered "dead":
 * - No page.tsx / page.js
 * - No route.ts / route.js (API)
 * - Not a layout-only segment with children
 */
export function findDeadRoutes(routes: RouteNode[]): DeadRouteResult[] {
  const dead: DeadRouteResult[] = [];

  function walk(node: RouteNode): void {
    const hasPage = node.hasPage;
    const hasApi = node.hasApiRoute;
    const hasChildren = node.children && node.children.length > 0;
    const hasLayout = node.hasLayout;

    if (!hasPage && !hasApi) {
      if (!hasChildren) {
        dead.push({
          path: node.routePath,
          reason: 'No page, API route, or children found',
        });
      } else if (!hasLayout) {
        dead.push({
          path: node.routePath,
          reason: 'Intermediate segment with no layout or page',
        });
      }
    }

    if (hasChildren) {
      node.children.forEach(walk);
    }
  }

  routes.forEach(walk);
  return dead;
}

export function buildReport(routes: RouteNode[]): AnalysisReport {
  const dead = findDeadRoutes(routes);
  const deadPaths = new Set(dead.map((d) => d.path));

  const allPaths: string[] = [];
  function collect(node: RouteNode) {
    allPaths.push(node.routePath);
    node.children?.forEach(collect);
  }
  routes.forEach(collect);

  return {
    totalRoutes: allPaths.length,
    deadRoutes: dead,
    activeRoutes: allPaths.filter((p) => !deadPaths.has(p)),
  };
}
