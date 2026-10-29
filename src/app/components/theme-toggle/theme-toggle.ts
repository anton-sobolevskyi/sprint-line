import { Component, inject } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';
import { Theme } from '@core/services/theme';

@Component({
  imports: [HlmButton, NgIcon],
  selector: 'sl-theme-toggle',
  styleUrl: './theme-toggle.scss',
  templateUrl: './theme-toggle.html',
  providers: [provideIcons({ lucideSun, lucideMoon })],
})
export class ThemeToggle {
  readonly theme = inject(Theme);
}
