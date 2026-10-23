import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';

import { AuthApiService } from '../core/auth/auth-api.service';
import { SHELL_MESSAGES } from './shell.messages';

@Component({
  selector: 'sl-app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ...HlmButtonImports],
  templateUrl: './app-shell.layout.html',
})
export class AppShellLayout {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly messages = SHELL_MESSAGES;
  readonly isLoggingOut = signal(false);

  logout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.authApi.logout().subscribe({
      next: () => {
        this.isLoggingOut.set(false);
        void this.router.navigateByUrl('/login');
      },
      error: () => {
        this.isLoggingOut.set(false);
        void this.router.navigateByUrl('/login');
      },
    });
  }
}
