import { describe, expect, it } from "vitest";
import { createProjectSchema } from "./project-create-dialog.schema";
describe("createProjectSchema", () => {
  it("valid", () => expect(createProjectSchema.safeParse({ name: "Project", description: "" }).success).toBe(true));
  it("invalid", () => expect(createProjectSchema.safeParse({ name: "", description: "" }).success).toBe(false));
});
