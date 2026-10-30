import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CommandPalette } from './command-palette';

describe('CommandPalette', () => {
  let service: CommandPalette;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommandPalette);
  });

  it('show sets open true', () => {
    service.show();
    expect(service.open()).toBe(true);
  });

  it('hide sets open false', () => {
    service.show();
    service.hide();
    expect(service.open()).toBe(false);
  });

  it('toggle flips', () => {
    service.toggle();
    expect(service.open()).toBe(true);
    service.toggle();
    expect(service.open()).toBe(false);
  });
});
