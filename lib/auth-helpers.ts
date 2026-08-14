import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user as typeof session.user & { id: string };
}

export async function getUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Auth guard for route handlers. Unlike requireUser it never redirects, so
 * callers can return a 401 JSON body instead of a 307 to /login.
 */
export async function requireApiUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as typeof session.user & { id: string };
}
