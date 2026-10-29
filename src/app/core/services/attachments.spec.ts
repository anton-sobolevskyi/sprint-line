import { TestBed } from '@angular/core/testing';
import { Attachments } from './attachments';

describe('Attachments', () => {
  let service: Attachments;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Attachments);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
