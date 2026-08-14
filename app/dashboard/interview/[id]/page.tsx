import { InterviewSessionView } from "@/modules/interview/components/interview-session-view";

type Params = Promise<{ id: string }>;

export default async function InterviewSessionPage({ params }: { params: Params }) {
  const { id } = await params;

  return <InterviewSessionView id={id} />;
}
