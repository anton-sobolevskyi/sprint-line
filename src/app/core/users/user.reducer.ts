import { createFeature, createReducer, on } from '@ngrx/store';

import { AuthActions } from '../../store/auth/auth.actions';
import { UserActions } from './user.actions';
import { UserResponseDto } from '@types';

export interface UserState {
  currentUser: UserResponseDto | null;
  loadStatus: 'idle' | 'loading' | 'success' | 'error';
  loadError: string | null;
}

export const initialUserState: UserState = {
  currentUser: null,
  loadStatus: 'idle',
  loadError: null,
};

export const userFeature = createFeature({
  name: 'user',
  reducer: createReducer(
    initialUserState,
    on(UserActions.loadMe, (state): UserState => ({
      ...state,
      loadStatus: 'loading',
      loadError: null,
    })),
    on(UserActions.loadMeSuccess, (state, { user }): UserState => ({
      ...state,
      currentUser: user,
      loadStatus: 'success',
      loadError: null,
    })),
    on(UserActions.loadMeFailure, (state, { errorMessage }): UserState => ({
      ...state,
      loadStatus: 'error',
      loadError: errorMessage,
    })),
    on(UserActions.setCurrentUser, (state, { user }): UserState => ({
      ...state,
      currentUser: user,
      loadStatus: 'success',
      loadError: null,
    })),
    on(UserActions.clearCurrentUser, AuthActions.clearSession, (): UserState => initialUserState)
  ),
});

export const {
  name: userFeatureKey,
  reducer: userReducer,
  selectUserState,
  selectCurrentUser,
  selectLoadStatus,
  selectLoadError,
} = userFeature;
