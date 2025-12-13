import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "./_components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your account",
};

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight">
        Set new password
      </h1>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
