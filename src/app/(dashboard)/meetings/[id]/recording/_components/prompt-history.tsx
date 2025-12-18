"use client";

import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

interface PromptRun {
  id: string;
  promptId: string;
  promptTitle: string;
  participantName: string;
  result: string | null;
  error: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
}

interface PromptHistoryProps {
  runs: PromptRun[];
  isLoading?: boolean;
}

function StatusIcon({ status }: { status: PromptRun["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 text-green-500" />;
    case "failed":
      return <AlertCircle className="size-4 text-red-500" />;
    case "processing":
      return <Loader2 className="size-4 animate-spin text-blue-500" />;
    default:
      return <Clock className="size-4 text-gray-500" />;
  }
}

export function PromptHistory({ runs, isLoading }: PromptHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>Previous AI analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (runs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>Previous AI analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No analysis has been run yet. Use the form above to analyze
            transcripts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis History</CardTitle>
        <CardDescription>Previous AI analysis results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {runs.map((run) => (
          <Collapsible key={run.id}>
            <div className="rounded-lg border">
              <CollapsibleTrigger className="hover:bg-accent/50 flex w-full items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <StatusIcon status={run.status} />
                  <div className="text-left">
                    <div className="font-medium">{run.promptTitle}</div>
                    <div className="text-muted-foreground text-sm">
                      {run.participantName} &middot;{" "}
                      {formatDistanceToNow(new Date(run.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t px-4 py-3">
                  {run.status === "completed" && run.result && (
                    <div className="text-sm whitespace-pre-wrap">
                      {run.result}
                    </div>
                  )}
                  {run.status === "failed" && run.error && (
                    <div className="text-destructive text-sm">{run.error}</div>
                  )}
                  {run.status === "processing" && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Loader2 className="size-4 animate-spin" />
                      Processing...
                    </div>
                  )}
                  {run.status === "pending" && (
                    <div className="text-muted-foreground text-sm">
                      Waiting to be processed...
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}
