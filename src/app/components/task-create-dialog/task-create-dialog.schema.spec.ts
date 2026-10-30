import { describe, expect, it } from "vitest";
import { createTaskSchema } from "./task-create-dialog.schema";
describe("createTaskSchema", () => {
  it("valid", () => expect(createTaskSchema.safeParse({ title: "Task", description: "", status: "TODO", priority: "LOW", dueDate: "", assignedToId: "" }).success).toBe(true));
  it("invalid", () => expect(createTaskSchema.safeParse({ title: "", description: "", status: "TODO", priority: "LOW", dueDate: "", assignedToId: "" }).success).toBe(false));
});
