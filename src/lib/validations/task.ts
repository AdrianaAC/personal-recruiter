import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title must be 150 characters or less"),

  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .or(z.literal("")),

  dueDate: z.string().optional().nullable().or(z.literal("")),

  isSpecificDate: z.boolean().optional(),

  completed: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
