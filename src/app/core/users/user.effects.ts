import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import { getApiErrorMessage } from '../api/api-error';
import { UserActions } from './user.actions';
import { UsersApiService } from './users-api.service';

@Injectable()
export class UserEffects {
  private readonly actions$ = inject(Actions);
  private readonly usersApi = inject(UsersApiService);

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
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
