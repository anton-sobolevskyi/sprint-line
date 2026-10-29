import { Component, inject, OnInit, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated } from '../../../core/auth/auth.selectors';
import { UserActions } from '../../../core/users/user.actions';
import { getApiErrorMessage } from '../../../core/api/api-error';
import { AuthLayout } from '../../../layout/auth-layout/auth-layout';
import { AUTH_MESSAGES } from '../../../constants';

@Component({
  imports: [HlmButton, RouterLink, AuthLayout],
  selector: 'sl-verify-email',
  styleUrl: './verify-email.scss',
  templateUrl: './verify-email.html',
})
export class VerifyEmail implements OnInit {
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
