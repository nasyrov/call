"use client";

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  return (
    <video
      className="aspect-video w-full max-w-4xl rounded-lg bg-black"
      controls
      src={src}
    >
      Your browser does not support the video element.
    </video>
  );
}
