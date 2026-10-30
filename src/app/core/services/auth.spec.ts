import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { beforeEach, describe, expect, it } from 'vitest';

import { authFeature } from '../../store/auth/auth.reducer';
import { Auth } from './auth';
import { Session } from './session';

describe('Auth', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore({ [authFeature.name]: authFeature.reducer }),
        Session,
        Auth,
      ],
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(Auth)).toBeTruthy();
  });
});
