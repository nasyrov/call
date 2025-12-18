"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  useServerActionMutation,
  useServerActionQuery,
} from "~/hooks/use-server-action";
import { deleteRecording } from "./_actions/delete-recording";
import { getMeetingRecording } from "./_actions/get-meeting-recording";
import { getPromptRuns } from "./_actions/get-prompt-runs";
import { PromptForm } from "./_components/prompt-form";
import { PromptHistory } from "./_components/prompt-history";
import { VideoPlayer } from "./_components/video-player";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function MeetingRecordingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data, isPending, error } = useServerActionQuery(getMeetingRecording, {
    queryKey: ["meeting-recording", params.id],
    input: { meetingId: params.id },
    refetchInterval: (query) => {
      // Auto-refresh every 5s while recording is processing
      const status = query.state.data?.recordingStatus;
      return status === "recording" ? 5000 : false;
    },
  });

  const {
    data: promptRunsData,
    isPending: isPromptRunsPending,
    refetch: refetchPromptRuns,
  } = useServerActionQuery(getPromptRuns, {
    queryKey: ["prompt-runs", params.id],
    input: { meetingId: params.id },
  });

  const { mutate: handleDelete, isPending: isDeleting } =
    useServerActionMutation(deleteRecording, {
      onSuccess: () => {
        toast.success("Recording deleted");
        router.push("/previous");
      },
      onError: (err) => {
        toast.error(err.message ?? "Failed to delete recording");
      },
    });

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error.message}</p>
        <Button asChild>
          <Link href="/previous">
            <ArrowLeft className="mr-2 size-4" />
            Back to Previous Meetings
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/previous">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            {isPending ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <>
                <h1 className="text-2xl font-semibold">{data?.title}</h1>
                {data?.endedAt && (
                  <p className="text-muted-foreground text-sm">
                    {format(
                      new Date(data.endedAt),
                      "EEEE, MMMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        {data?.recording && (
          <div className="flex items-center gap-2">
            <Button asChild>
              <a href={data.recording.url} download>
                <Download className="mr-2 size-4" />
                Download
              </a>
            </Button>
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete recording?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The recording and all
                    transcriptions will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete({ meetingId: params.id })}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {isPending && (
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full max-w-4xl" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {!isPending &&
        !data?.recording &&
        data?.recordingStatus === "recording" && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-muted-foreground">
                Recording is being processed...
              </span>
            </div>
            <Skeleton className="aspect-video w-full max-w-4xl" />
          </div>
        )}

      {!isPending &&
        !data?.recording &&
        data?.recordingStatus !== "recording" && (
          <div className="text-muted-foreground py-12 text-center">
            No recording available for this meeting.
          </div>
        )}

      {data?.recording?.url && (
        <>
          <div className="flex justify-center">
            <VideoPlayer src={data.recording.url} />
          </div>
          {data.recording.duration && (
            <p className="text-muted-foreground text-center text-sm">
              Duration: {formatDuration(data.recording.duration)}
            </p>
          )}
        </>
      )}

      {data?.audioTracks && (
        <div className="mx-auto max-w-4xl space-y-6">
          <PromptForm
            meetingId={params.id}
            audioTracks={data.audioTracks}
            onSuccess={() => refetchPromptRuns()}
          />
          <PromptHistory
            runs={promptRunsData ?? []}
            isLoading={isPromptRunsPending}
          />
        </div>
      )}
    </div>
  );
}
