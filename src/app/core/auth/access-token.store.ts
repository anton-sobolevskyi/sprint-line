import { Injectable, signal } from '@angular/core';

/**
 * Holds the JWT access token in memory only (not localStorage).
 * Refresh token lives in an HttpOnly cookie managed by the backend.
 */
@Injectable({ providedIn: 'root' })
export class AccessTokenStore {
  private readonly token = signal<string | null>(null);

  readonly accessToken = this.token.asReadonly();

  set(accessToken: string): void {
    this.token.set(accessToken);
  }

  clear(): void {
    this.token.set(null);
  }

  getSnapshot(): string | null {
    return this.token();
  }
}
