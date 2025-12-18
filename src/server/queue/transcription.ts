import { transcriptionQueue } from "./index";

export interface TranscriptionJobData {
  audioTrackId: string;
  meetingId: string;
  recordingId: string;
  participantIdentity: string;
  participantName: string;
  filePath: string;
}

export async function queueTranscriptionJob(data: TranscriptionJobData) {
  await transcriptionQueue.add("transcribe", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
}
