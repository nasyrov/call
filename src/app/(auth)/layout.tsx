import { Card, CardContent } from "~/components/ui/card";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="bg-muted flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
