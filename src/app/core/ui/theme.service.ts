import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'sprintline-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly mediaQuery =
    typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : null;

  /** User preference: light | dark | system */
  readonly mode = signal<ThemeMode>(this.readStoredMode());

  /** Resolved appearance after system preference is applied */
  readonly resolved = signal<'light' | 'dark'>(this.resolve(this.mode()));

  constructor() {
    this.apply(this.mode());

    this.mediaQuery?.addEventListener('change', () => {
      if (this.mode() === 'system') {
        this.apply('system');
      }
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore quota / private mode
    }
    this.apply(mode);
  }

  /** Cycle light → dark → system → light */
  cycle(): void {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const current = this.mode();
    const next = order[(order.indexOf(current) + 1) % order.length]!;
    this.setMode(next);
  }

  /** Simple light/dark flip (ignores system for one-click toggle). */
  toggleLightDark(): void {
    const next = this.resolved() === 'dark' ? 'light' : 'dark';
    this.setMode(next);
  }

  private readStoredMode(): ThemeMode {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        return raw;
      }
    } catch {
      // ignore
    }
    return 'system';
  }

  private resolve(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'light' || mode === 'dark') {
      return mode;
    }
    return this.mediaQuery?.matches ? 'dark' : 'light';
  }

  private apply(mode: ThemeMode): void {
    const resolved = this.resolve(mode);
    this.resolved.set(resolved);

    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = resolved;
  }
}
