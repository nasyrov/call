import { redirect } from "next/navigation";

import { QueryProvider } from "~/components/providers/query-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Toaster } from "~/components/ui/sonner";
import { getSession } from "~/server/better-auth/server";
import { AppSidebar } from "./_components/app-sidebar";
import { MeetingDialogProvider } from "./_components/meeting-dialog-provider";
import { UserMenu } from "./_components/user-menu";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <QueryProvider>
      <Toaster position="top-center" />
      <MeetingDialogProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <UserMenu user={session.user} />
            </header>
            <main className="flex-1 p-4">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </MeetingDialogProvider>
    </QueryProvider>
  );
}
