import { z } from "zod";

export const applicationContactRoleValues = [
  "RECRUITER",
  "HIRING_MANAGER",
  "INTERVIEWER",
  "REFERRAL",
  "COORDINATOR",
  "OTHER",
] as const;

export const applicationContactRoleSchema = z.enum(applicationContactRoleValues);

export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name is too long"),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email is too long")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .trim()
    .max(50, "Phone is too long")
    .optional()
    .or(z.literal("")),

  linkedinUrl: z
    .string()
    .trim()
    .url("Invalid LinkedIn URL")
    .max(500, "LinkedIn URL is too long")
    .optional()
    .or(z.literal("")),

  companyName: z
    .string()
    .trim()
    .max(100, "Company name is too long")
    .optional()
    .or(z.literal("")),

  jobTitle: z
    .string()
    .trim()
    .max(100, "Job title is too long")
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .trim()
    .max(5000, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

export const createContactSchema = contactSchema.extend({
  applicationId: z.string().cuid().optional(),
  role: applicationContactRoleSchema.optional(),
});

export const updateContactSchema = contactSchema.partial();

export const attachContactToApplicationSchema = z.object({
  contactId: z.string().cuid(),
  role: applicationContactRoleSchema,
});

export const updateApplicationContactSchema = z.object({
  role: applicationContactRoleSchema,
});

export type ContactInput = z.infer<typeof contactSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type AttachContactToApplicationInput = z.infer<
  typeof attachContactToApplicationSchema
>;
export type UpdateApplicationContactInput = z.infer<
  typeof updateApplicationContactSchema
>;