import { AudioFrame } from "@livekit/rtc-node";

const WHISPER_URL = process.env.WHISPER_URL || "http://whisper:8000/v1";

interface TranscriptionResult {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  language?: string;
}

export class Transcriber {
  private sampleRate: number;

  constructor(sampleRate: number = 16000) {
    this.sampleRate = sampleRate;
  }

  async transcribe(audioFrames: AudioFrame[]): Promise<TranscriptionResult> {
    if (audioFrames.length === 0) {
      return { text: "" };
    }

    // Combine all audio frames into a single buffer
    const totalSamples = audioFrames.reduce(
      (sum, frame) => sum + frame.samplesPerChannel,
      0,
    );
    const combinedBuffer = new Int16Array(totalSamples);

    let offset = 0;
    for (const frame of audioFrames) {
      const samples = frame.data;
      combinedBuffer.set(samples.slice(0, frame.samplesPerChannel), offset);
      offset += frame.samplesPerChannel;
    }

    // Convert Int16Array to WAV format
    const wavBuffer = this.createWavBuffer(combinedBuffer, this.sampleRate);

    // Send to Whisper API
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([wavBuffer], { type: "audio/wav" }),
      "audio.wav",
    );
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");

    try {
      const response = await fetch(`${WHISPER_URL}/audio/transcriptions`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Whisper API error:", response.status, errorText);
        return { text: "" };
      }

      const result = await response.json();

      return {
        text: result.text || "",
        segments: result.segments,
        language: result.language,
      };
    } catch (error) {
      console.error("Transcription error:", error);
      return { text: "" };
    }
  }

  private createWavBuffer(
    samples: Int16Array,
    sampleRate: number,
  ): ArrayBuffer {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = samples.length * 2;
    const bufferSize = 44 + dataSize;

    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // RIFF header
    this.writeString(view, 0, "RIFF");
    view.setUint32(4, bufferSize - 8, true);
    this.writeString(view, 8, "WAVE");

    // fmt chunk
    this.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    this.writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    // Write audio data
    const dataOffset = 44;
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(dataOffset + i * 2, samples[i], true);
    }

    return buffer;
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}
