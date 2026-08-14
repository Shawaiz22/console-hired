import { z } from "zod";

export const SkillCategorySchema = z.enum(["language", "framework", "tool", "soft", "domain"]);

export const ResumeSkillSchema = z.object({
  name: z.string(),
  category: SkillCategorySchema,
});

export const ResumeExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  bullets: z.array(z.string()),
});

export const ResumeEducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  year: z.number().nullable(),
});

export const ResumeProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  tech: z.array(z.string()),
});

export const ParsedResumeSchema = z.object({
  name: z.string(),
  email: z.string().nullable(),
  yearsOfExperience: z.number(),
  skills: z.array(ResumeSkillSchema),
  experience: z.array(ResumeExperienceSchema),
  education: z.array(ResumeEducationSchema),
  projects: z.array(ResumeProjectSchema),
});

export type ParsedResume = z.infer<typeof ParsedResumeSchema>;

/** Upload limits shared by the dropzone, the upload form and the API routes. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_UPLOAD_EXTENSIONS = [".pdf", ".docx"] as const;

export function isAcceptedUpload(file: File) {
  return ACCEPTED_UPLOAD_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}

export const ResumeUploadSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select a resume file" })
    .refine((file) => isAcceptedUpload(file), "Only PDF and DOCX files are supported")
    .refine((file) => file.size <= MAX_UPLOAD_BYTES, "File must be under 5MB"),
});

export type ResumeUploadValues = z.infer<typeof ResumeUploadSchema>;
