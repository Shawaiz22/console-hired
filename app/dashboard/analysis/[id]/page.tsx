import { AnalysisView } from "@/modules/analysis/components/analysis-view";

type Params = Promise<{ id: string }>;

export default async function AnalysisResultPage({ params }: { params: Params }) {
  const { id } = await params;

  return <AnalysisView id={id} />;
}
