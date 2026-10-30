import { describe, expect, it } from 'vitest';

import { AuthActions } from './auth.actions';
import { authReducer, initialAuthState } from './auth.reducer';
import { selectIsAuthenticated } from './auth.selectors';

describe('authReducer', () => {
  it('sets the access token', () => {
    const state = authReducer(
      initialAuthState,
      AuthActions.setAccessToken({ accessToken: 'jwt-token' })
    );
    expect(state.accessToken).toBe('jwt-token');
  });

  it('clears the session', () => {
    const withToken = authReducer(
      initialAuthState,
      AuthActions.setAccessToken({ accessToken: 'jwt-token' })
    );
    const cleared = authReducer(withToken, AuthActions.clearSession());
    expect(cleared).toEqual(initialAuthState);
  });
});

describe('selectIsAuthenticated', () => {
  it('is false when token is missing or empty', () => {
    expect(selectIsAuthenticated.projector(null)).toBe(false);
    expect(selectIsAuthenticated.projector('')).toBe(false);
  });

  it('is true when a non-empty token is present', () => {
    expect(selectIsAuthenticated.projector('jwt')).toBe(true);
  });
});
