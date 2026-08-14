import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, creds.email as string),
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(creds.password as string, user.passwordHash);
        if (!valid) return null;

        if (!user.emailVerified) return null;

        return user;
      },
    }),
  ],
});
