import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';

import { HlmButtonImports } from '@spartan-ng/helm/button';

import { getApiErrorMessage } from '../core/api/api-error';
import { AuthApiService } from '../core/auth/auth-api.service';
import { appToast } from '../core/ui/toast';
import { UserActions } from '../core/users/user.actions';
import { selectCurrentUser } from '../core/users/user.reducer';
import { SHELL_MESSAGES } from './shell.messages';

@Component({
  selector: 'sl-app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ...HlmButtonImports],
  templateUrl: './app-shell.layout.html',
})
export class AppShellLayout {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  readonly messages = SHELL_MESSAGES;
  readonly isLoggingOut = signal(false);
  readonly currentUser = this.store.selectSignal(selectCurrentUser);

  readonly resendSubmitting = signal(false);

  readonly needsEmailVerification = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return false;
    }
    const verifiedAt = user.emailVerifiedAt;
    return verifiedAt == null || verifiedAt.length === 0;
  });

  constructor() {
    if (!this.currentUser()) {
      this.store.dispatch(UserActions.loadMe());
    }
  }

  resendVerification(): void {
    if (this.resendSubmitting() || !this.needsEmailVerification()) {
      return;
    }

    this.resendSubmitting.set(true);
    this.authApi.resendVerification().subscribe({
      next: () => {
        this.resendSubmitting.set(false);
        appToast.success(this.messages.verify.success);
      },
      error: (error: unknown) => {
        this.resendSubmitting.set(false);
        appToast.error(getApiErrorMessage(error));
      },
    });
  }

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
