import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectTasks } from './project-tasks';

describe('ProjectTasks', () => {
  let component: ProjectTasks;
  let fixture: ComponentFixture<ProjectTasks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTasks],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectTasks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
