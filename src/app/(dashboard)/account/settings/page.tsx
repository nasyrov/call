import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { DeleteAccountCard } from "./_components/delete-account-card";
import { PasswordForm } from "./_components/password-form";
import { ProfileForm } from "./_components/profile-form";
import { SessionsCard } from "./_components/sessions-card";

export const metadata: Metadata = {
  title: "Account Settings",
};

export default async function AccountSettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <ProfileForm user={session.user} />
      <PasswordForm />
      <SessionsCard currentSessionToken={session.session.token} />
      <DeleteAccountCard />
    </div>
  );
}
