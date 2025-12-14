import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meeting Lobby",
};

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
