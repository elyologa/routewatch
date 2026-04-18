import fs from 'fs';
import path from 'path';

export interface RouteNode {
  segment: string;
  fullPath: string;
  isDynamic: boolean;
  isCatchAll: boolean;
  isRouteGroup: boolean;
  hasPage: boolean;
  hasLayout: boolean;
  children: RouteNode[];
}

const PAGE_FILES = ['page.tsx', 'page.ts', 'page.jsx', 'page.js'];
const LAYOUT_FILES = ['layout.tsx', 'layout.ts', 'layout.jsx', 'layout.js'];

function hasFile(dir: string, fileNames: string[]): boolean {
  return fileNames.some((f) => fs.existsSync(path.join(dir, f)));
}

function parseSegment(segment: string) {
  const isDynamic = /^\[(?!\.\.\.)/.test(segment) && segment.endsWith(']');
  const isCatchAll = /^\[\.\.\..+\]$/.test(segment);
  const isRouteGroup = segment.startsWith('(') && segment.endsWith(')');
  return { isDynamic, isCatchAll, isRouteGroup };
}

export function scanRoutes(appDir: string, currentPath = ''): RouteNode[] {
  if (!fs.existsSync(appDir)) {
    throw new Error(`App directory not found: ${appDir}`);
  }

  const entries = fs.readdirSync(appDir, { withFileTypes: true });
  const nodes: RouteNode[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const segment = entry.name;
    const { isDynamic, isCatchAll, isRouteGroup } = parseSegment(segment);
    const fullSegmentPath = isRouteGroup
      ? currentPath
      : `${currentPath}/${segment}`;
    const absoluteDir = path.join(appDir, segment);

    const node: RouteNode = {
      segment,
      fullPath: fullSegmentPath || '/',
      isDynamic,
      isCatchAll,
      isRouteGroup,
      hasPage: hasFile(absoluteDir, PAGE_FILES),
      hasLayout: hasFile(absoluteDir, LAYOUT_FILES),
      children: scanRoutes(absoluteDir, fullSegmentPath),
    };

    nodes.push(node);
  }

  return nodes;
}
