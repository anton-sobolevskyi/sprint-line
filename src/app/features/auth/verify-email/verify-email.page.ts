import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';

import { getApiErrorMessage } from '../../../core/api/api-error';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { selectIsAuthenticated } from '../../../core/auth/auth.selectors';
import { UserActions } from '../../../core/users/user.actions';
import { AuthThemeToggle } from '../auth-theme-toggle.component';
import { AUTH_MESSAGES } from '../auth.messages';

@Component({
  selector: 'sl-verify-email-page',
  imports: [RouterLink, AuthThemeToggle, ...HlmButtonImports, ...HlmCardImports],
  templateUrl: './verify-email.page.html',
})
export class VerifyEmailPage implements OnInit {
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);

  readonly messages = AUTH_MESSAGES;
  readonly isAuthenticated = this.store.selectSignal(selectIsAuthenticated);

  readonly status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
    if (!token) {
      this.status.set('error');
      this.errorMessage.set(this.messages.verifyEmail.missingToken);
      return;
    }

    this.status.set('loading');
    this.authApi.verifyEmail({ token }).subscribe({
      next: () => {
        this.status.set('success');
        if (this.isAuthenticated()) {
          this.store.dispatch(UserActions.loadMe());
        }
      },
      error: (error: unknown) => {
        this.status.set('error');
        this.errorMessage.set(getApiErrorMessage(error));
      },
    });
  }
}
