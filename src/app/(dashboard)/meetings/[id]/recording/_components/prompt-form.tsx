"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Play } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { TranscriptionData } from "~/server/db/schema/recordings";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useServerActionMutation } from "~/hooks/use-server-action";
import { prompts } from "~/server/prompts";
import { runPrompt } from "../_actions/run-prompt";

interface AudioTrack {
  id: string;
  participantName: string;
  transcription: TranscriptionData | null;
}

interface PromptFormProps {
  meetingId: string;
  audioTracks: AudioTrack[];
  onSuccess?: () => void;
}

const formSchema = z.object({
  audioTrackId: z.string().min(1, "Please select a participant"),
  promptId: z.string().min(1, "Please select a prompt"),
});

type FormValues = z.infer<typeof formSchema>;

export function PromptForm({
  meetingId,
  audioTracks,
  onSuccess,
}: PromptFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      audioTrackId: "",
      promptId: "",
    },
  });

  const { mutate, isPending } = useServerActionMutation(runPrompt, {
    onSuccess: () => {
      toast.success("Prompt completed successfully");
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to run prompt");
    },
  });

  const availableTracks = audioTracks.filter(
    (track) => track.transcription?.status === "completed",
  );

  const onSubmit = (values: FormValues) => {
    mutate({
      meetingId,
      audioTrackId: values.audioTrackId,
      promptId: values.promptId,
    });
  };

  if (availableTracks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis</CardTitle>
          <CardDescription>
            Run AI prompts against participant transcripts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No completed transcriptions available yet. Please wait for
            transcription to complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
        <CardDescription>
          Run AI prompts against participant transcripts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="audioTrackId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participant</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a participant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.participantName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promptId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a prompt" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {prompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                          {prompt.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 size-4" />
                    Run Prompt
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
