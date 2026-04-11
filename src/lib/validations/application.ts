import { z } from "zod";

export const applicationStatusValues = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "TAKE_HOME",
  "FINAL_INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export const priorityValues = ["LOW", "MEDIUM", "HIGH"] as const;

export const workModeValues = ["REMOTE", "HYBRID", "ONSITE"] as const;

export const createApplicationSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(100, "Company name must be 100 characters or less"),

  roleTitle: z
    .string()
    .trim()
    .min(1, "Role title is required")
    .max(100, "Role title must be 100 characters or less"),

  location: z
    .string()
    .trim()
    .max(100, "Location must be 100 characters or less")
    .optional()
    .or(z.literal("")),

  workMode: z.enum(workModeValues).nullable().optional(),

  jobUrl: z
    .string()
    .trim()
    .url("Job URL must be a valid URL")
    .optional()
    .or(z.literal("")),

  jobDescription: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  contactName: z
    .string()
    .trim()
    .max(100, "Contact name must be 100 characters or less")
    .optional()
    .or(z.literal("")),

  applicationNotes: z
    .string()
    .trim()
    .max(5000, "Notes must be 5000 characters or less")
    .optional()
    .or(z.literal("")),

  offerExpiresAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  status: z.enum(applicationStatusValues).default("SAVED"),

  priority: z.enum(priorityValues).default("MEDIUM"),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
