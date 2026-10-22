import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { components } from '../../../types/api.schema';
import { AuthSessionService } from './auth-session.service';

type RegisterDto = components['schemas']['RegisterDto'];
type LoginDto = components['schemas']['LoginDto'];
type AuthResponseDto = components['schemas']['AuthResponseDto'];

/**
 * Thin HTTP wrapper for /auth/* endpoints.
 * Full login/register UI belongs to Phase 1; this is the API foundation.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  register(dto: RegisterDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${this.baseUrl}/register`, dto, {
        withCredentials: true,
      })
      .pipe(tap((response) => this.authSession.applyAuthResponse(response)));
  }

  login(dto: LoginDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${this.baseUrl}/login`, dto, {
        withCredentials: true,
      })
      .pipe(tap((response) => this.authSession.applyAuthResponse(response)));
  }

  /**
   * Clears the refresh cookie on the server and the in-memory access token.
   * Backend responds 201.
   */
  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/logout`, null, {
        withCredentials: true,
      })
      .pipe(tap(() => this.authSession.clearSession()));
  }

  refresh(): Observable<AuthResponseDto> {
    return this.authSession.refresh();
  }
}
