import type { Metadata } from "next";

import { ForgotPasswordForm } from "./_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight">
        Reset your password
      </h1>
      <ForgotPasswordForm />
    </>
  );
}
