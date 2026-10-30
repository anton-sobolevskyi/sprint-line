import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { STORAGE_KEY } from '@constants/config';
import { Theme } from './theme';

describe('Theme', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.classList.remove('dark');
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.classList.remove('dark');
  });

  function createService(): Theme {
    TestBed.configureTestingModule({});
    return TestBed.inject(Theme);
  }

  it('defaults to system mode when nothing is stored', () => {
    const theme = createService();
    expect(theme.mode()).toBe('system');
  });

  it('reads a stored preference', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const theme = createService();
    expect(theme.mode()).toBe('dark');
    expect(theme.resolved()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('persists setMode and updates the document', () => {
    const theme = createService();
    theme.setMode('light');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
    expect(theme.resolved()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('toggleLightDark flips resolved appearance', () => {
    const theme = createService();
    theme.setMode('light');
    theme.toggleLightDark();
    expect(theme.mode()).toBe('dark');
    expect(theme.resolved()).toBe('dark');
    theme.toggleLightDark();
    expect(theme.mode()).toBe('light');
  });
});
