import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideFolderKanban,
  lucideHouse,
  lucideLogOut,
  lucidePanelLeft,
  lucideUserRound,
} from '@ng-icons/lucide';
import { Store } from '@ngrx/store';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';

import { getApiErrorMessage } from '../core/api/api-error';
import { AuthApiService } from '../core/auth/auth-api.service';
import { appToast } from '../core/ui/toast';
import { UserActions } from '../core/users/user.actions';
import { selectCurrentUser } from '../core/users/user.reducer';
import { SHELL_MESSAGES } from './shell.messages';

@Component({
  selector: 'sl-app-shell',
  providers: [
    provideIcons({
      lucideHouse,
      lucideFolderKanban,
      lucideUserRound,
      lucideLogOut,
      lucidePanelLeft,
    }),
  ],
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIcon,
    ...HlmButtonImports,
    ...HlmSidebarImports,
  ],
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

  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return '';
    }
    return user.name?.trim() || user.email || '';
  });

  readonly userInitials = computed(() => {
    const name = this.userDisplayName();
    if (!name) {
      return '?';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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
