"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { ProfileFormValues } from "../_validation/profile-schema";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
import { profileSchema } from "../_validation/profile-schema";

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    const { error } = await authClient.updateUser({
      name: values.name,
    });

    if (error) {
      toast.error(error.message ?? "An error occurred");
      return;
    }

    toast.success("Profile updated successfully");
    router.refresh();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Your name"
                      autoComplete="name"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <FormLabel>Email</FormLabel>
              <Input type="email" value={user.email} disabled />
              <p className="text-muted-foreground text-sm">
                Email cannot be changed
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Updating..." : "Update"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
