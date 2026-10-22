import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import type { components } from '../../../types/api.schema';
import { AuthSessionService } from './auth-session.service';

type RegisterDto = components['schemas']['RegisterDto'];
type LoginDto = components['schemas']['LoginDto'];
type AuthResponseDto = components['schemas']['AuthResponseDto'];

/**
 * Thin HTTP wrapper for /auth/* endpoints.
 * Full login/register UI belongs to Phase 1.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);

  register(dto: RegisterDto): Observable<AuthResponseDto> {
    const url = API_ENDPOINTS.auth.register;

    return this.http
      .post<AuthResponseDto>(url, dto, { withCredentials: true })
      .pipe(tap((response) => this.authSession.applyAuthResponse(response)));
  }

  login(dto: LoginDto): Observable<AuthResponseDto> {
    const url = API_ENDPOINTS.auth.login;

    return this.http
      .post<AuthResponseDto>(url, dto, { withCredentials: true })
      .pipe(tap((response) => this.authSession.applyAuthResponse(response)));
  }

  /**
   * Clears the refresh cookie on the server and the in-memory access token.
   * Backend responds 201.
   */
  logout(): Observable<void> {
    const url = API_ENDPOINTS.auth.logout;

    return this.http
      .post<void>(url, null, { withCredentials: true })
      .pipe(tap(() => this.authSession.clearSession()));
  }

  refresh(): Observable<AuthResponseDto> {
    return this.authSession.refresh();
  }
}
