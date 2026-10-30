import { TestBed } from '@angular/core/testing';
import { Actions } from '@ngrx/effects';
import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { Users } from '@core/services/users';
import { UserActions } from './user.actions';
import { UserEffects } from './user.effects';
import { UserResponseDto } from '@types';
import { Action } from '@ngrx/store';

describe('UserEffects', () => {
  it('loadMe success', async () => {
    const actions$ = new Subject<Action>();
    TestBed.configureTestingModule({
      providers: [
        { provide: Actions, useValue: actions$ },
        { provide: Users, useValue: { getMe: () => of({ id: '1' } as unknown as UserResponseDto) } },
        UserEffects,
      ],
    });
    const effects = TestBed.inject(UserEffects);
    const results: { type: string }[] = [];
    effects.loadMe$.subscribe((r) => results.push(r));
    actions$.next(UserActions.loadMe());
    await new Promise((r) => setTimeout(r, 0));
    expect(results[0]?.type).toContain('Success');
  });

  it('loadMe failure', async () => {
    const actions$ = new Subject<Action>();
    TestBed.configureTestingModule({
      providers: [
        { provide: Actions, useValue: actions$ },
        { provide: Users, useValue: { getMe: () => throwError(() => new Error('boom')) } },
        UserEffects,
      ],
    });
    const effects = TestBed.inject(UserEffects);
    const results: { type: string }[] = [];
    effects.loadMe$.subscribe((r) => results.push(r));
    actions$.next(UserActions.loadMe());
    await new Promise((r) => setTimeout(r, 0));
    expect(results[0]?.type).toContain('Failure');
  });
});