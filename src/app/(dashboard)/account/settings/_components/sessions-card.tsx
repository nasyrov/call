"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, MonitorIcon, SmartphoneIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { authClient } from "~/server/better-auth/client";

interface Session {
  id: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export function SessionsCard({
  currentSessionToken,
}: {
  currentSessionToken: string;
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await authClient.listSessions();

      if (error) {
        toast.error(error.message ?? "Failed to load sessions");
        setLoading(false);
        return;
      }

      setSessions(data ?? []);
      setLoading(false);
    };

    void fetchSessions();
  }, []);

  const handleRevoke = async (token: string) => {
    setRevokingId(token);

    const { error } = await authClient.revokeSession({ token });

    if (error) {
      toast.error(error.message ?? "Failed to revoke session");
      setRevokingId(null);
      return;
    }

    toast.success("Session revoked successfully");
    setSessions((prev) => prev.filter((s) => s.token !== token));
    setRevokingId(null);
  };

  const handleRevokeAll = async () => {
    setRevokingId("all");

    const { error } = await authClient.revokeSessions();

    if (error) {
      toast.error(error.message ?? "Failed to revoke sessions");
      setRevokingId(null);
      return;
    }

    router.push("/login");
    router.refresh();
  };

  const parseUserAgent = (userAgent: string | null | undefined) => {
    if (!userAgent)
      return { device: "Unknown device", browser: "Unknown browser" };

    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const browserMatch = /(chrome|safari|firefox|edge|opera)/i.exec(userAgent);
    const browser = browserMatch?.[1] ?? "Browser";

    return {
      device: isMobile ? "Mobile" : "Desktop",
      browser: browser.charAt(0).toUpperCase() + browser.slice(1).toLowerCase(),
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
        <CardDescription>
          Manage your active sessions across devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="size-6 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active sessions</p>
        ) : (
          <div className="flex flex-col gap-4">
            {sessions.map((session) => {
              const { device, browser } = parseUserAgent(session.userAgent);
              const isCurrentSession = session.token === currentSessionToken;
              const Icon = device === "Mobile" ? SmartphoneIcon : MonitorIcon;

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <Icon className="text-muted-foreground size-5" />
                    <div>
                      <p className="text-sm font-medium">
                        {browser} on {device}
                        {isCurrentSession && (
                          <span className="text-muted-foreground ml-2">
                            (Current)
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {session.ipAddress ?? "Unknown IP"} &middot; Last active{" "}
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {!isCurrentSession && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(session.token)}
                      disabled={revokingId !== null}
                    >
                      {revokingId === session.token ? "Revoking..." : "Revoke"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      {sessions.length > 1 && (
        <CardFooter className="justify-end">
          <Button
            variant="outline"
            onClick={handleRevokeAll}
            disabled={revokingId !== null}
          >
            {revokingId === "all"
              ? "Revoking all sessions..."
              : "Revoke all sessions"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
