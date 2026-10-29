import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCreateDialog } from './task-create-dialog';

describe('TaskCreateDialog', () => {
  let component: TaskCreateDialog;
  let fixture: ComponentFixture<TaskCreateDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCreateDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCreateDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
