import { describe, expect, it } from 'vitest';

import { appToast } from '@core/ui/toast';

describe('appToast', () => {
  it('calls toast helpers', () => {
    expect(() => appToast.success('s')).not.toThrow();
    expect(() => appToast.error('e')).not.toThrow();
    expect(() => appToast.info('i')).not.toThrow();
    expect(() => appToast.message('m', 'desc')).not.toThrow();
  });
});