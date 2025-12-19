import { exec } from "child_process";
import { readFile, readdir, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";

import { env } from "~/env";

const execAsync = promisify(exec);

interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
}

interface TranscriptionResult {
  segments: TranscriptionSegment[];
}

const SPEECHKIT_STT_URL =
  "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize";

// Yandex sync API limits: 1MB file size, 30 seconds audio
const CHUNK_DURATION_SECONDS = 25;

async function splitAudioIntoChunks(inputBuffer: Buffer): Promise<Buffer[]> {
  const timestamp = Date.now();
  const inputPath = join(tmpdir(), `stt-input-${timestamp}.ogg`);
  const outputPattern = join(tmpdir(), `stt-chunk-${timestamp}-%03d.ogg`);

  try {
    await writeFile(inputPath, inputBuffer);

    // Split into chunks and convert to mono with lower bitrate
    await execAsync(
      `ffmpeg -i "${inputPath}" -f segment -segment_time ${CHUNK_DURATION_SECONDS} -ac 1 -c:a libopus -b:a 32k "${outputPattern}" -y -loglevel error`,
    );

    // Find all chunk files
    const files = await readdir(tmpdir());
    const chunkFiles = files
      .filter((f) => f.startsWith(`stt-chunk-${timestamp}-`))
      .sort();

    console.log(`Split audio into ${chunkFiles.length} chunks`);

    // Read all chunks
    const chunks: Buffer[] = [];
    for (const file of chunkFiles) {
      const chunkPath = join(tmpdir(), file);
      const chunkBuffer = await readFile(chunkPath);
      console.log(`Chunk ${file}: ${chunkBuffer.length} bytes`);
      chunks.push(chunkBuffer);
      await unlink(chunkPath).catch(() => undefined);
    }

    return chunks;
  } finally {
    await unlink(inputPath).catch(() => undefined);
  }
}

async function transcribeChunk(audioBuffer: Buffer): Promise<string> {
  const params = new URLSearchParams({
    folderId: env.YANDEX_FOLDER_ID!,
    lang: "ru-RU",
    format: "oggopus",
  });

  const response = await fetch(`${SPEECHKIT_STT_URL}?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Api-Key ${env.YANDEX_API_KEY}`,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(audioBuffer),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Transcription failed: ${errorText}`);
  }

  const result = (await response.json()) as { result?: string };
  return result.result ?? "";
}

export async function transcribeAudio(
  audioBuffer: Buffer,
): Promise<TranscriptionResult> {
  if (!env.YANDEX_API_KEY || !env.YANDEX_FOLDER_ID) {
    throw new Error("Yandex credentials not configured");
  }

  // Split audio into chunks (handles mono conversion too)
  const chunks = await splitAudioIntoChunks(audioBuffer);

  // Transcribe each chunk
  const transcriptions: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;

    // Skip chunks that are too large (shouldn't happen with 25s chunks at 32kbps)
    if (chunk.length > 1024 * 1024) {
      console.warn(`Chunk ${i} is too large (${chunk.length} bytes), skipping`);
      continue;
    }

    console.log(`Transcribing chunk ${i + 1}/${chunks.length}...`);
    const text = await transcribeChunk(chunk);
    if (text) {
      transcriptions.push(text);
    }
  }

  const fullText = transcriptions.join(" ");
  console.log(`Transcription complete: ${fullText.length} characters`);

  if (!fullText.trim()) {
    return { segments: [] };
  }

  return {
    segments: [
      {
        text: fullText,
        start: 0,
        end: chunks.length * CHUNK_DURATION_SECONDS,
      },
    ],
  };
}
