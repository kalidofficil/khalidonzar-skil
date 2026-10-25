import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth";

// Every page in the (app) folder is for signed-in users and gets the app frame.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
