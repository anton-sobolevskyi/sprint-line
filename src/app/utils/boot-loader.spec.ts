import { describe, expect, it } from 'vitest';

import { hideBootLoader } from './boot-loader';

describe('hideBootLoader', () => {
  it('does nothing when document is undefined', () => {
    // jsdom provides document
    expect(() => hideBootLoader()).not.toThrow();
  });

  it('hides loader when present', () => {
    const loader = document.createElement('div');
    loader.id = 'sl-boot-loader';
    document.body.appendChild(loader);
    hideBootLoader();
    expect(loader.classList.contains('sl-boot-loader--hide')).toBe(true);
    expect(loader.getAttribute('aria-busy')).toBe('false');
  });

  it('is idempotent', () => {
    const loader = document.createElement('div');
    loader.id = 'sl-boot-loader';
    loader.classList.add('sl-boot-loader--hide');
    document.body.appendChild(loader);
    hideBootLoader();
    expect(loader.classList.contains('sl-boot-loader--hide')).toBe(true);
  });
});