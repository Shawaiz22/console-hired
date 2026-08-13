import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/modules/dashboard/components/stat-card";
import { EmptyState } from "@/modules/dashboard/components/empty-state";

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Welcome back, {firstName}</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Resumes analyzed" value="0" />
        <StatCard label="Interviews completed" value="0" />
        <StatCard label="Best match score" value="—" />
      </div>

      <EmptyState
        title="No analyses yet"
        description="Upload your resume and a job description to get started."
        action={
          <Button asChild>
            <Link href="/dashboard/analyze">Analyze resume</Link>
          </Button>
        }
      />
    </div>
  );
}
