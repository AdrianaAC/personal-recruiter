import { z } from "zod";

export const createCallUpSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title must be 150 characters or less"),

  description: z
    .string()
    .trim()
    .max(120, "Description must be 120 characters or less")
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be 2000 characters or less")
    .optional()
    .or(z.literal("")),

  scheduledAt: z.string().optional().nullable().or(z.literal("")),

  contactId: z.string().trim().optional().nullable().or(z.literal("")),
});

export type CreateCallUpInput = z.infer<typeof createCallUpSchema>;
