"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import type { ResetPasswordFormValues } from "../_validation/reset-password-schema";
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
import { resetPasswordSchema } from "../_validation/reset-password-schema";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  if (urlError === "INVALID_TOKEN") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>
            This password reset link is invalid or has expired.
          </AlertDescription>
        </Alert>
        <Button variant="link" asChild>
          <Link href="/password/forgot">Request a new reset link</Link>
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>No reset token provided.</AlertDescription>
        </Alert>
        <Button variant="link" asChild>
          <Link href="/password/forgot">Request a password reset</Link>
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <Alert>
          <CheckCircleIcon />
          <AlertDescription>
            Your password has been reset successfully.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/login">Sign in with your new password</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setError(null);

    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (error) {
      setError(error.message ?? "An error occurred");
      return;
    }

    setIsSuccess(true);
  };

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
          Enter your new password below.
        </p>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter new password (min 8 characters)"
                  autoComplete="new-password"
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
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
          {form.formState.isSubmitting ? "Resetting..." : "Reset password"}
        </Button>

        <Button variant="link" asChild className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </form>
    </Form>
  );
}
