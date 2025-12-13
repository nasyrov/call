"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import type { ForgotPasswordFormValues } from "../_validation/forgot-password-schema";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { authClient } from "~/server/better-auth/client";
import { forgotPasswordSchema } from "../_validation/forgot-password-schema";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setError(null);

    const { error } = await authClient.$fetch<{ status: boolean }>(
      "/request-password-reset",
      {
        method: "POST",
        body: {
          email: values.email,
          redirectTo: "/password/reset",
        },
      },
    );

    if (error) {
      setError(error.message ?? "An error occurred");
      return;
    }

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <Alert>
          <CheckCircleIcon />
          <AlertDescription>
            If an account with that email exists, we&apos;ve sent you a password
            reset link. Check your email and click the link to reset your
            password.
          </AlertDescription>
        </Alert>
        <Button variant="link" asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-muted-foreground text-sm">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
        </Button>

        <Button variant="link" asChild className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </form>
    </Form>
  );
}
