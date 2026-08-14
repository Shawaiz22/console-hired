import { z } from "zod";

export const SenioritySchema = z.enum(["intern", "junior", "mid", "senior", "lead", "unspecified"]);

export const ParsedJDSchema = z.object({
  title: z.string(),
  company: z.string().nullable(),
  seniority: SenioritySchema,
  minYears: z.number().nullable(),
  maxYears: z.number().nullable(),
  requiredSkills: z.array(z.string()),
  niceToHaveSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
});

export type ParsedJD = z.infer<typeof ParsedJDSchema>;
