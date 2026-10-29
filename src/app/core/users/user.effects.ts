import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import { UserActions } from './user.actions';
import { getApiErrorMessage } from '@utils';
import { Users } from '@core/services/users';

@Injectable()
export class UserEffects {
  private readonly actions$ = inject(Actions);
  private readonly usersApi = inject(Users);

  readonly loadMe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadMe),
      switchMap(() =>
        this.usersApi.getMe().pipe(
          map((user) => UserActions.loadMeSuccess({ user })),
          catchError((error: unknown) =>
            of(
              UserActions.loadMeFailure({
                errorMessage: getApiErrorMessage(error),
              })
            )
          )
        )
      )
    )
  );
}
