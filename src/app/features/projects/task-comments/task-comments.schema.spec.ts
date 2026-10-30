import { describe, expect, it } from "vitest";
import { commentContentSchema } from "./task-comments.schema";
describe("commentContentSchema", () => {
  it("valid", () => expect(commentContentSchema.safeParse({ content: "hi there" }).success).toBe(true));
  it("invalid", () => expect(commentContentSchema.safeParse({ content: "" }).success).toBe(false));
});
