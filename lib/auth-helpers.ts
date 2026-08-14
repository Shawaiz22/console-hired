import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!dbUser) redirect("/login");

  return session.user as typeof session.user & { id: string };
}

export async function getUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  return dbUser ? session.user : null;
}

/**
 * Auth guard for route handlers. Unlike requireUser it never redirects, so
 * callers can return a 401 JSON body instead of a 307 to /login.
 */
export async function requireApiUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!dbUser) return null;

  return session.user as typeof session.user & { id: string };
}
