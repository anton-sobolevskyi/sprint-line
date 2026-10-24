import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  it('defaults to system and applies light or dark from matchMedia', () => {
    const service = new ThemeService();
    expect(service.mode()).toBe('system');
    expect(['light', 'dark']).toContain(service.resolved());
  });

  it('setMode light removes dark class and persists', () => {
    const service = new ThemeService();
    service.setMode('light');
    expect(service.mode()).toBe('light');
    expect(service.resolved()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('sprintline-theme')).toBe('light');
  });

  it('setMode dark adds dark class', () => {
    const service = new ThemeService();
    service.setMode('dark');
    expect(service.resolved()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggleLightDark flips resolved appearance', () => {
    const service = new ThemeService();
    service.setMode('light');
    service.toggleLightDark();
    expect(service.mode()).toBe('dark');
    service.toggleLightDark();
    expect(service.mode()).toBe('light');
  });

  it('reads stored preference on construct', () => {
    localStorage.setItem('sprintline-theme', 'dark');
    const service = new ThemeService();
    expect(service.mode()).toBe('dark');
    expect(service.resolved()).toBe('dark');
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('sprintline-theme', 'neon');
    const service = new ThemeService();
    expect(service.mode()).toBe('system');
  });
});
