import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { UserMenu } from "./user-menu";

export function DashboardHeader({ name, email }: { name?: string | null; email?: string | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Logo size="sm" />
      </div>

      <UserMenu name={name} email={email} />
    </header>
  );
}
