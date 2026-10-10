import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createAndSendOtp } from "@/lib/email";

export const runtime = "nodejs";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      const [user] = await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, existing.id))
        .returning({ id: users.id, email: users.email });

      return NextResponse.json({ user, requiresVerification: false }, { status: 200 });
    }

    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning({ id: users.id, email: users.email });

    let emailSent = true;
    try {
      await createAndSendOtp(email);
    } catch (otpErr) {
      console.error("[register] Failed to send OTP email:", otpErr);
      emailSent = false;
    }

    return NextResponse.json({ user, requiresVerification: true, emailSent }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
