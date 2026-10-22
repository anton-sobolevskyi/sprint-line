import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthSessionService } from './auth-session.service';

/**
 * Restores the session from the HttpOnly refresh cookie on app bootstrap.
 * Failures are ignored — the user simply stays logged out.
 */
export function restoreAuthSession(): Promise<void> {
  const authSession = inject(AuthSessionService);

  return firstValueFrom(authSession.refresh()).then(
    () => undefined,
    () => undefined,
  );
}
