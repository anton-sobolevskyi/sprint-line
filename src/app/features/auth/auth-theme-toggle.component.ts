import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';

import { HlmButtonImports } from '@spartan-ng/helm/button';

import { ThemeService } from '../../core/ui/theme.service';

@Component({
  selector: 'sl-auth-theme-toggle',
  providers: [provideIcons({ lucideSun, lucideMoon })],
  imports: [NgIcon, ...HlmButtonImports],
  template: `
    <button
      type="button"
      hlmBtn
      variant="ghost"
      size="icon"
      class="text-muted-foreground absolute top-4 right-4 z-10 size-9"
      [attr.aria-label]="
        theme.resolved() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      "
      (click)="theme.toggleLightDark()"
    >
      @if (theme.resolved() === 'dark') {
        <ng-icon name="lucideSun" />
      } @else {
        <ng-icon name="lucideMoon" />
      }
    </button>
  `,
})
export class AuthThemeToggle {
  readonly theme = inject(ThemeService);
}
