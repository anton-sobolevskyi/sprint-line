import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, shareReplay } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { components } from '../../../types/api.schema';
import { AccessTokenStore } from './access-token.store';

export type AuthResponseDto = components['schemas']['AuthResponseDto'];

/**
 * Serializes refresh calls so concurrent 401s share one in-flight refresh.
 * Backend revokes all sessions if a rotated refresh token is replayed.
 */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = inject(HttpClient);
  private readonly accessTokenStore = inject(AccessTokenStore);

  private refreshInFlight: Observable<AuthResponseDto> | null = null;

  applyAuthResponse(response: AuthResponseDto): void {
    this.accessTokenStore.set(response.accessToken);
  }

  clearSession(): void {
    this.accessTokenStore.clear();
    this.refreshInFlight = null;
  }

  /**
   * POST /auth/refresh with credentials (HttpOnly cookie).
   * Concurrent callers await the same request.
   */
  refresh(): Observable<AuthResponseDto> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http
        .post<AuthResponseDto>(
          `${environment.apiUrl}/auth/refresh`,
          null,
          { withCredentials: true },
        )
        .pipe(
          shareReplay({
            bufferSize: 1,
            refCount: false,
          }),
        );

      // Clear the shared observable after it settles so the next 401 can refresh again.
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
