import { exec } from "child_process";
import { readFile, unlink, writeFile } from "fs/promises";
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

async function convertToMono(inputBuffer: Buffer): Promise<Buffer> {
  const inputPath = join(tmpdir(), `stt-input-${Date.now()}.ogg`);
  const outputPath = join(tmpdir(), `stt-output-${Date.now()}.ogg`);

  try {
    await writeFile(inputPath, inputBuffer);
    await execAsync(
      `ffmpeg -i "${inputPath}" -ac 1 -c:a libopus -b:a 48k "${outputPath}" -y -loglevel error`,
    );
    const outputBuffer = await readFile(outputPath);
    console.log(
      `Converted to mono: ${inputBuffer.length} -> ${outputBuffer.length} bytes`,
    );
    return outputBuffer;
  } finally {
    await unlink(inputPath).catch(() => undefined);
    await unlink(outputPath).catch(() => undefined);
  }
}

export async function transcribeAudio(
  audioBuffer: Buffer,
): Promise<TranscriptionResult> {
  if (!env.YANDEX_API_KEY || !env.YANDEX_FOLDER_ID) {
    throw new Error("Yandex credentials not configured");
  }

  // Convert to mono (Yandex processes each channel separately, causing duplicates)
  const monoBuffer = await convertToMono(audioBuffer);

  // Use synchronous recognition API (supports files up to 1MB)
  const params = new URLSearchParams({
    folderId: env.YANDEX_FOLDER_ID,
    lang: "ru-RU",
    format: "oggopus",
  });

  const response = await fetch(`${SPEECHKIT_STT_URL}?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Api-Key ${env.YANDEX_API_KEY}`,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(monoBuffer),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Transcription failed: ${errorText}`);
  }

  const result = (await response.json()) as { result?: string };

  console.log("Yandex SpeechKit raw response:", JSON.stringify(result));

  if (!result.result) {
    return { segments: [] };
  }

  // Synchronous API returns single text result without timing
  // We'll create a single segment with the full text
  return {
    segments: [
      {
        text: result.result,
        start: 0,
        end: 0,
      },
    ],
  };
}
