import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, startWatcher } from './routeWatcher';
import * as routeScanner from './routeScanner';
import fs from 'fs';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return { ...actual, watch: vi.fn() };
});

vi.mock('./routeScanner', () => ({ scanRoutes: vi.fn() }));

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('delays execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets timer on repeated calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('startWatcher', () => {
  it('calls watch on the resolved appDir', () => {
    const mockWatcher = { close: vi.fn() };
    vi.mocked(fs.watch).mockReturnValue(mockWatcher as unknown as fs.FSWatcher);
    vi.mocked(routeScanner.scanRoutes).mockReturnValue({ segment: 'app', path: '/', children: [], isDynamic: false, isGroup: false, hasPage: true, hasLayout: false });

    const cb = vi.fn();
    const watcher = startWatcher({ appDir: './app', debounceMs: 0 }, cb);
    expect(fs.watch).toHaveBeenCalled();
    expect(watcher).toBe(mockWatcher);
  });
});
