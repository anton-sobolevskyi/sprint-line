import { describe, expect, it } from 'vitest';
import { updateProjectSchema } from './project-detail.schema';
describe('updateProjectSchema', () => {
  it('valid', () => expect(updateProjectSchema.safeParse({ name: 'Project', description: '' }).success).toBe(true));
  it('invalid', () => expect(updateProjectSchema.safeParse({ name: '', description: '' }).success).toBe(false));
});
