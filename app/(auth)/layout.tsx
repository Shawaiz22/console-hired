import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-helpers";
import { Logo } from "@/components/logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Logo size="lg" className="mb-8" />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
