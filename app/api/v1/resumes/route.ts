import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { extractText, ExtractionError } from "@/modules/resume/utils/extract";
import { parseResume } from "@/modules/resume/utils/parse-resume";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  try {
    const rawText = await extractText(file);
    const textHash = createHash("sha256").update(rawText).digest("hex");

    const [resume] = await db
      .insert(resumes)
      .values({
        userId: user.id,
        fileName: file.name,
        fileType: file.name.endsWith(".docx") ? "docx" : "pdf",
        rawText,
        textHash,
      })
      .returning({ id: resumes.id, fileName: resumes.fileName });

    parseResume(resume.id).catch(console.error);

    return NextResponse.json({ resume }, { status: 201 });
  } catch (err) {
    if (err instanceof ExtractionError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 422 });
    }
    console.error("[resume-upload]", err);
    return NextResponse.json({ error: "Could not process this file" }, { status: 500 });
  }
}
