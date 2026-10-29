import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectCreateDialog } from './project-create-dialog';

describe('ProjectCreateDialog', () => {
  let component: ProjectCreateDialog;
  let fixture: ComponentFixture<ProjectCreateDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCreateDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCreateDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
