import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { firstValueFrom, Observable, shareReplay } from 'rxjs';
import { selectAccessToken } from '@core/auth/auth.reducer';
import { AuthActions } from '@core/auth/auth.actions';
import { API_ENDPOINTS } from '@constants/api';
import { AuthResponseDto } from '@types';

@Service()
export class Session {
  private readonly http = inject(HttpClient);
  private readonly store = inject(Store);

  private refreshInFlight: Observable<AuthResponseDto> | null = null;

  readonly accessToken = this.store.selectSignal(selectAccessToken);

  applyAuthResponse(response: AuthResponseDto): void {
    this.store.dispatch(AuthActions.setAccessToken({ accessToken: response.accessToken }));
  }

  clearSession(): void {
    this.store.dispatch(AuthActions.clearSession());
    this.refreshInFlight = null;
  }

  getAccessTokenSnapshot(): string | null {
    return this.accessToken();
  }

  refresh(): Observable<AuthResponseDto> {
    if (!this.refreshInFlight) {
      const refreshUrl = API_ENDPOINTS.auth.refresh;

      this.refreshInFlight = this.http
        .post<AuthResponseDto>(refreshUrl, null, { withCredentials: true })
        .pipe(
          shareReplay({
            bufferSize: 1,
            refCount: false,
          })
        );

      void firstValueFrom(this.refreshInFlight).then(
        (response) => {
          this.applyAuthResponse(response);
          this.refreshInFlight = null;
        },
        () => {
          this.clearSession();
        }
      );
    }

    return this.refreshInFlight;
  }
}
