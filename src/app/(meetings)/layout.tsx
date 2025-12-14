import { redirect } from "next/navigation";

import { QueryProvider } from "~/components/providers/query-provider";
import { Toaster } from "~/components/ui/sonner";
import { getSession } from "~/server/better-auth/server";

export default async function MeetingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <QueryProvider>
      <Toaster position="top-center" />
      <main className="h-screen">{children}</main>
    </QueryProvider>
  );
}
