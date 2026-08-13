import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailVerificationCodes, users } from "@/lib/db/schema";
import { createAndSendOtp } from "@/lib/email";

export const runtime = "nodejs";

const SendOtpSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email } = parsed.data;

    // 1. Look up user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    const successResponse = NextResponse.json(
      { message: "If an account exists, a verification code has been sent." },
      { status: 200 }
    );

    // 2. Not found or already verified -> return 200 with standard response
    if (!user || user.emailVerified) {
      return successResponse;
    }

    // 3. Cooldown check (60 seconds)
    const [latestCode] = await db
      .select()
      .from(emailVerificationCodes)
      .where(eq(emailVerificationCodes.email, email))
      .orderBy(desc(emailVerificationCodes.createdAt))
      .limit(1);

    if (latestCode) {
      const elapsedMs = Date.now() - new Date(latestCode.createdAt).getTime();
      if (elapsedMs < 60 * 1000) {
        const retryAfter = Math.ceil((60 * 1000 - elapsedMs) / 1000);
        return NextResponse.json(
          { error: "Please wait before requesting another code", retryAfter },
          { status: 429 }
        );
      }
    }

    // 4. Create new code & send email
    await createAndSendOtp(email);

    return successResponse;
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json(
      { error: "Could not send verification email. Please try again." },
      { status: 500 }
    );
  }
}
