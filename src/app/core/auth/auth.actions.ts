import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Set Access Token': props<{ accessToken: string }>(),
    'Clear Session': emptyProps(),
  },
});
