"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
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
import { getRecordingUrl } from "./_actions/get-signed-url";
import { VideoPlayer } from "./_components/video-player";

export default function RecordingPlaybackPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data, isPending, error } = useServerActionQuery(getRecordingUrl, {
    queryKey: ["recording", params.id],
    input: { recordingId: params.id },
  });

  const { mutate: handleDelete, isPending: isDeleting } =
    useServerActionMutation(deleteRecording, {
      onSuccess: () => {
        toast.success("Recording deleted");
        router.push("/recordings");
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete recording");
      },
    });

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error.message}</p>
        <Button asChild>
          <Link href="/recordings">
            <ArrowLeft className="mr-2 size-4" />
            Back to Recordings
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
            <Link href="/recordings">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          {isPending ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <h1 className="text-2xl font-semibold">{data?.title}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data?.url && (
            <Button asChild>
              <a href={data.url} download>
                <Download className="mr-2 size-4" />
                Download
              </a>
            </Button>
          )}
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
                  This action cannot be undone. The recording will be
                  permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete({ recordingId: params.id })}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex justify-center">
        {isPending ? (
          <Skeleton className="aspect-video w-full max-w-4xl rounded-lg" />
        ) : data?.url ? (
          <VideoPlayer src={data.url} />
        ) : null}
      </div>

      {data?.duration && (
        <p className="text-muted-foreground text-center text-sm">
          Duration: {Math.floor(data.duration / 60)}:
          {(data.duration % 60).toString().padStart(2, "0")}
        </p>
      )}
    </div>
  );
}
