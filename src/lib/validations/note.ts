import { z } from "zod";

export const createNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .max(100, "Title must be 100 characters or less")
    .optional()
    .or(z.literal("")),

  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(5000, "Content must be 5000 characters or less"),

  assessmentDueDate: z.string().optional().nullable().or(z.literal("")),

  assessmentSubmitted: z.boolean().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
