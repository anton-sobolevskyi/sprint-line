import { describe, expect, it } from 'vitest';
import { updateTaskSchema } from './task-detail.schema';
describe('updateTaskSchema', () => {
  it('valid', () => expect(updateTaskSchema.safeParse({ title: 'Task', description: '', status: 'TODO', priority: 'LOW', dueDate: '', assignedToId: '' }).success).toBe(true));
  it('invalid', () => expect(updateTaskSchema.safeParse({ title: '', description: '', status: 'TODO', priority: 'LOW', dueDate: '', assignedToId: '' }).success).toBe(false));
});
