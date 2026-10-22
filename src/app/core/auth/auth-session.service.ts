import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, firstValueFrom, shareReplay } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import type { components } from '../../../types/api.schema';
import { AuthActions } from './auth.actions';
import { selectAccessToken } from './auth.selectors';

export type AuthResponseDto = components['schemas']['AuthResponseDto'];

/**
 * Serializes refresh calls so concurrent 401s share one in-flight refresh.
 * Global session state lives in the NgRx auth feature store.
 */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(Store);

  private refreshInFlight: Observable<AuthResponseDto> | null = null;

  readonly accessToken = this.store.selectSignal(selectAccessToken);

  applyAuthResponse(response: AuthResponseDto): void {
    this.store.dispatch(
      AuthActions.setAccessToken({ accessToken: response.accessToken }),
    );
  }

  clearSession(): void {
    this.store.dispatch(AuthActions.clearSession());
    this.refreshInFlight = null;
  }

  getAccessTokenSnapshot(): string | null {
    return this.accessToken();
  }

  /**
   * POST /auth/refresh with credentials (HttpOnly cookie).
   * Concurrent callers await the same request.
   */
  refresh(): Observable<AuthResponseDto> {
    if (!this.refreshInFlight) {
      const refreshUrl = API_ENDPOINTS.auth.refresh;

      this.refreshInFlight = this.http
        .post<AuthResponseDto>(refreshUrl, null, { withCredentials: true })
        .pipe(
          shareReplay({
            bufferSize: 1,
            refCount: false,
          }),
        );

      void firstValueFrom(this.refreshInFlight).then(
        (response) => {
          this.applyAuthResponse(response);
          this.refreshInFlight = null;
        },
        () => {
          this.clearSession();
        },
      );
    }

    return this.refreshInFlight;
  }
}
