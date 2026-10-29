import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskComments } from './task-comments';

describe('TaskComments', () => {
  let component: TaskComments;
  let fixture: ComponentFixture<TaskComments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskComments],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskComments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
