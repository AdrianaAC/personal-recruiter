import { z } from "zod";

export const interviewTypeValues = [
  "RECRUITER",
  "TECHNICAL",
  "BEHAVIORAL",
  "MANAGER",
  "PANEL",
  "TAKE_HOME_REVIEW",
  "FINAL",
  "OTHER",
] as const;

export const interviewOutcomeValues = [
  "PENDING",
  "PASSED",
  "FAILED",
  "CANCELLED",
] as const;

export const createInterviewSchema = z.object({
  type: z.enum(interviewTypeValues),

  stageName: z
    .string()
    .trim()
    .max(100, "Stage name must be 100 characters or less")
    .optional()
    .or(z.literal("")),

  scheduledAt: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),

  durationMinutes: z
    .number()
    .int("Duration must be an integer")
    .positive("Duration must be greater than 0")
    .optional()
    .nullable(),

  interviewerName: z
    .string()
    .trim()
    .max(100, "Interviewer name must be 100 characters or less")
    .optional()
    .or(z.literal("")),

  interviewerRole: z
    .string()
    .trim()
    .max(100, "Interviewer role must be 100 characters or less")
    .optional()
    .or(z.literal("")),

  locationOrLink: z
    .string()
    .trim()
    .max(500, "Location or link must be 500 characters or less")
    .optional()
    .or(z.literal("")),

  outcome: z.enum(interviewOutcomeValues).nullable().optional(),

  notes: z
    .string()
    .trim()
    .max(5000, "Notes must be 5000 characters or less")
    .optional()
    .or(z.literal("")),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;