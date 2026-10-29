import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskAttachments } from './task-attachments';

describe('TaskAttachments', () => {
  let component: TaskAttachments;
  let fixture: ComponentFixture<TaskAttachments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskAttachments],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskAttachments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
