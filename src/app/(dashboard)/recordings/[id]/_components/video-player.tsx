"use client";

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  return (
    <video
      src={src}
      controls
      className="aspect-video w-full max-w-4xl rounded-lg bg-black"
    >
      Your browser does not support the video tag.
    </video>
  );
}
