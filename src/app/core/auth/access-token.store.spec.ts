import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { AccessTokenStore } from './access-token.store';

describe('AccessTokenStore', () => {
  it('stores and clears the access token in memory', () => {
    TestBed.configureTestingModule({});
    const store = TestBed.inject(AccessTokenStore);

    expect(store.getSnapshot()).toBeNull();

    store.set('token-abc');
    expect(store.getSnapshot()).toBe('token-abc');
    expect(store.accessToken()).toBe('token-abc');

    store.clear();
    expect(store.getSnapshot()).toBeNull();
  });
});
