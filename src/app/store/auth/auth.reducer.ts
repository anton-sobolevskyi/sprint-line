import { createFeature, createReducer, on } from '@ngrx/store';

import { AuthActions } from './auth.actions';

export interface AuthState {
  accessToken: string | null;
}

export const initialAuthState: AuthState = {
  accessToken: null,
};

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialAuthState,
    on(AuthActions.setAccessToken, (state, { accessToken }): AuthState => ({
      ...state,
      accessToken,
    })),
    on(AuthActions.clearSession, (): AuthState => initialAuthState)
  ),
});

export const {
  name: authFeatureKey,
  reducer: authReducer,
  selectAuthState,
  selectAccessToken,
} = authFeature;
