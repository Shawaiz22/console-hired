import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-helpers";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8 font-mono text-lg font-medium">
        console.hired()
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
