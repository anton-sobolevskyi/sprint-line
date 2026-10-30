import { describe, expect, it } from 'vitest';

import { AuthActions } from '../../store/auth/auth.actions';
import { UserActions } from './user.actions';
import { initialUserState, userReducer, userFeature } from './user.reducer';
import { UserResponseDto } from '@types';

describe('userReducer', () => {
  it('loads', () => {
    const state = userReducer(initialUserState, UserActions.loadMe());
    expect(state.loadStatus).toBe('loading');
  });
  it('load success', () => {
    const user = { id: '1', name: 'A' } as unknown as UserResponseDto;
    const state = userReducer(initialUserState, UserActions.loadMeSuccess({ user }));
    expect(state.currentUser).toBe(user);
    expect(state.loadStatus).toBe('success');
  });
  it('load failure', () => {
    const state = userReducer(initialUserState, UserActions.loadMeFailure({ errorMessage: 'err' }));
    expect(state.loadStatus).toBe('error');
    expect(state.loadError).toBe('err');
  });
  it('set current user', () => {
    const user = { id: '2' } as unknown as UserResponseDto;
    const state = userReducer(initialUserState, UserActions.setCurrentUser({ user }));
    expect(state.currentUser).toBe(user);
  });
  it('clear current user', () => {
    const user = { id: '2' } as unknown as UserResponseDto;
    const withUser = userReducer(initialUserState, UserActions.setCurrentUser({ user }));
    const cleared = userReducer(withUser, UserActions.clearCurrentUser());
    expect(cleared).toEqual(initialUserState);
  });
  it('clears on auth clear session', () => {
    const user = { id: '2' } as unknown as UserResponseDto;
    const withUser = userReducer(initialUserState, UserActions.setCurrentUser({ user }));
    const cleared = userReducer(withUser, AuthActions.clearSession());
    expect(cleared).toEqual(initialUserState);
  });
});

describe('userFeature selectors', () => {
  it('projector works', () => {
    const sel = userFeature.selectCurrentUser;
    expect(sel.projector({ currentUser: null, loadStatus: 'idle', loadError: null })).toBeNull();
  });
});