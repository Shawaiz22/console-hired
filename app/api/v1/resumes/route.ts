import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { MAX_UPLOAD_BYTES } from "@/modules/resume/schemas/resume.schema";
import { extractText, ExtractionError } from "@/modules/resume/utils/extract";
import { parseResume } from "@/modules/resume/utils/parse-resume";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userResumes = await db.query.resumes.findMany({
    where: eq(resumes.userId, user.id),
    orderBy: (resumesTable, { desc }) => [desc(resumesTable.createdAt)],
  });

  return NextResponse.json({ resumes: userResumes });
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
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
    if (err && typeof err === "object" && "code" in err && err.code === "23503") {
      return NextResponse.json(
        { error: "User session expired or user not found. Please log in again." },
        { status: 401 }
      );
    }
    console.error("[resume-upload]", err);
    return NextResponse.json({ error: "Could not process this file" }, { status: 500 });
  }
}
