import type { Metadata } from "next";

import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new account",
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight">
        Create your account
      </h1>
      <RegisterForm />
    </>
  );
}
