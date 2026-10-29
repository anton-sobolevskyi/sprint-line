import { TestBed } from '@angular/core/testing';
import { ProjectMembers } from './project-members';

describe('ProjectMembers', () => {
  let service: ProjectMembers;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectMembers);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
