import { VerifyForm } from "@/modules/auth/components/verify-form";

type SearchParams = Promise<{ email?: string }>;

export default async function VerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const { email } = await searchParams;
  return <VerifyForm initialEmail={email ?? ""} />;
}
