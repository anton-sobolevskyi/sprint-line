import { createActionGroup, emptyProps, props } from '@ngrx/store';

import type { UserResponseDto } from './users-api.service';

export const UserActions = createActionGroup({
  source: 'User',
  events: {
    'Load Me': emptyProps(),
    'Load Me Success': props<{ user: UserResponseDto }>(),
    'Load Me Failure': props<{ errorMessage: string }>(),
    'Set Current User': props<{ user: UserResponseDto }>(),
    'Clear Current User': emptyProps(),
  },
});
