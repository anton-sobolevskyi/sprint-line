import { createSelector } from '@ngrx/store';

import { selectAccessToken } from './auth.reducer';

export const selectIsAuthenticated = createSelector(
  selectAccessToken,
  (accessToken): boolean => accessToken != null && accessToken.length > 0
);

export { selectAccessToken, selectAuthState } from './auth.reducer';
