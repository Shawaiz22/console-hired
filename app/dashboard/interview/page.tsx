import { InterviewStartForm } from "@/modules/interview/components/interview-start-form";

export default function InterviewStartPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">AI Mock Interview Practice</h1>
        <p className="text-sm text-muted-foreground">
          Simulate a real technical & behavioral interview customized to your resume and target job
          role.
        </p>
      </div>

      <InterviewStartForm />
    </div>
  );
}
