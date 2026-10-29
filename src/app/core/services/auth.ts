import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AuthResponseDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from '@types';
import { API_ENDPOINTS } from '@constants/api';
import { Session } from '@core/services/session';

@Service()
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(Session);

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

  logout(): Observable<void> {
    const url = API_ENDPOINTS.auth.logout;

    return this.http.post<void>(url, null, { withCredentials: true }).pipe(
      tap({
        next: () => this.authSession.clearSession(),
        error: () => this.authSession.clearSession(),
      })
    );
  }

  refresh(): Observable<AuthResponseDto> {
    return this.authSession.refresh();
  }

  forgotPassword(dto: ForgotPasswordDto): Observable<void> {
    const url = API_ENDPOINTS.auth.forgotPassword;
    return this.http.post<void>(url, dto);
  }

  resetPassword(dto: ResetPasswordDto): Observable<void> {
    const url = API_ENDPOINTS.auth.resetPassword;
    return this.http.post<void>(url, dto);
  }

  verifyEmail(dto: TokenDto): Observable<void> {
    const url = API_ENDPOINTS.auth.verifyEmail;
    return this.http.post<void>(url, dto);
  }

  resendVerification(): Observable<void> {
    const url = API_ENDPOINTS.auth.resendVerification;
    return this.http.post<void>(url, null);
  }
}
