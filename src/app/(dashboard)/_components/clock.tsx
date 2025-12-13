"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="space-y-1">
        <div className="text-7xl font-bold tracking-tight">--:--:--</div>
        <div className="text-muted-foreground text-lg">Loading...</div>
      </div>
    );
  }

  const timeString = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateString = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-1">
      <div className="text-7xl font-bold tracking-tight">{timeString}</div>
      <div className="text-muted-foreground text-lg">{dateString}</div>
    </div>
  );
}
