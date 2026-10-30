import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { STORAGE_KEY } from '@constants/config';
import { Theme } from '@core/services/theme';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  let fixture: ComponentFixture<ThemeToggle>;
  let theme: Theme;

  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.classList.remove('dark');

    await TestBed.configureTestingModule({
      imports: [ThemeToggle],
    }).compileComponents();

    theme = TestBed.inject(Theme);
    theme.setMode('light');

    fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders an accessible theme toggle button', () => {
    const button = fixture.nativeElement.querySelector('button[aria-label]');
    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-label')?.toLowerCase()).toMatch(/theme|dark|light/);
  });

  it('toggles the document theme when clicked', async () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(theme.resolved()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
