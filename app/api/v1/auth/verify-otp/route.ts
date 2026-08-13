import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailVerificationCodes, users } from "@/lib/db/schema";

export const runtime = "nodejs";

const VerifyOtpSchema = z.object({
  email: z.string().email("Enter a valid email"),
  code: z.string().min(6, "Code must be 6 digits"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, code } = parsed.data;

    // 1. Fetch newest code row for email
    const [record] = await db
      .select()
      .from(emailVerificationCodes)
      .where(eq(emailVerificationCodes.email, email))
      .orderBy(desc(emailVerificationCodes.createdAt))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: "No code found. Request a new one." }, { status: 400 });
    }

    // 2. Check if expired
    if (new Date(record.expiresAt) < new Date()) {
      await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.id, record.id));
      return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
    }

    // 3. Check attempts limit
    if (record.attempts >= 5) {
      await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.id, record.id));
      return NextResponse.json(
        { error: "Too many attempts. Request a new code." },
        { status: 429 }
      );
    }

    // 4. Check hash match
    const inputHash = crypto.createHash("sha256").update(code).digest("hex");

    if (inputHash !== record.codeHash) {
      const newAttempts = record.attempts + 1;

      if (newAttempts >= 5) {
        await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.id, record.id));
        return NextResponse.json(
          { error: "Too many attempts. Request a new code.", attemptsRemaining: 0 },
          { status: 429 }
        );
      } else {
        await db
          .update(emailVerificationCodes)
          .set({ attempts: newAttempts })
          .where(eq(emailVerificationCodes.id, record.id));
        return NextResponse.json(
          { error: "Invalid verification code.", attemptsRemaining: 5 - newAttempts },
          { status: 400 }
        );
      }
    }

    // 5. Match -> mark verified and delete codes
    await db.update(users).set({ emailVerified: new Date() }).where(eq(users.email, email));

    await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, email));

    return NextResponse.json({ message: "Email verified successfully." }, { status: 200 });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
