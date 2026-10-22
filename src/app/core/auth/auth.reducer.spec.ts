import { describe, expect, it } from 'vitest';

import { AuthActions } from './auth.actions';
import { authReducer, initialAuthState } from './auth.reducer';

describe('authReducer', () => {
  it('sets the access token', () => {
    const state = authReducer(
      initialAuthState,
      AuthActions.setAccessToken({ accessToken: 'jwt-token' }),
    );
    expect(state.accessToken).toBe('jwt-token');
  });

  it('clears the session', () => {
    const withToken = authReducer(
      initialAuthState,
      AuthActions.setAccessToken({ accessToken: 'jwt-token' }),
    );
    const cleared = authReducer(withToken, AuthActions.clearSession());
    expect(cleared).toEqual(initialAuthState);
  });
});
