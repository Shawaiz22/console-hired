import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { jobDescriptions } from "@/lib/db/schema";
import { extractText, ExtractionError } from "@/modules/resume/utils/extract";
import { parseJD } from "@/modules/resume/utils/parse-jd";

export const runtime = "nodejs";
export const maxDuration = 60;

const JDInputSchema = z.object({
  rawText: z.string().min(100, "Job description is too short to analyse"),
  title: z.string().optional(),
  company: z.string().optional(),
});

export async function GET() {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userJDs = await db.query.jobDescriptions.findMany({
    where: eq(jobDescriptions.userId, user.id),
    orderBy: (jdsTable, { desc }) => [desc(jdsTable.createdAt)],
  });

  return NextResponse.json({ jobDescriptions: userJDs });
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  let rawText = "";
  let title: string | undefined = undefined;
  let company: string | undefined = undefined;

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      title = (formData.get("title") as string) || undefined;
      company = (formData.get("company") as string) || undefined;

      if (!file) {
        const formText = formData.get("rawText") as string | null;
        if (!formText) {
          return NextResponse.json({ error: "No file or rawText provided" }, { status: 400 });
        }
        rawText = formText;
      } else {
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
        }
        rawText = await extractText(file);
      }
    } else {
      const body = await req.json();
      const parsed = JDInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      rawText = parsed.data.rawText;
      title = parsed.data.title;
      company = parsed.data.company;
    }

    if (!rawText || rawText.trim().length < 100) {
      return NextResponse.json(
        { error: "Job description is too short to analyse" },
        { status: 400 }
      );
    }

    const cleanText = rawText.trim();
    const textHash = createHash("sha256").update(cleanText).digest("hex");

    const [jobDescription] = await db
      .insert(jobDescriptions)
      .values({
        userId: user.id,
        title: title ?? null,
        company: company ?? null,
        rawText: cleanText,
        textHash,
      })
      .returning({
        id: jobDescriptions.id,
        title: jobDescriptions.title,
        company: jobDescriptions.company,
      });

    parseJD(jobDescription.id).catch(console.error);

    return NextResponse.json({ jobDescription }, { status: 201 });
  } catch (err) {
    if (err instanceof ExtractionError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 422 });
    }
    console.error("[jd-upload]", err);
    return NextResponse.json({ error: "Could not process job description" }, { status: 500 });
  }
}
