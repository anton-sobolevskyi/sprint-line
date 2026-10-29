import { TestBed } from '@angular/core/testing';
import { CommandPalette } from './command-palette';

describe('CommandPalette', () => {
  let service: CommandPalette;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommandPalette);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
