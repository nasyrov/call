import { fileURLToPath } from "node:url";
import type { JobContext } from "@livekit/agents";
import type {
  AudioFrame,
  RemoteParticipant,
  RemoteTrack,
} from "@livekit/rtc-node";
import { cli, defineAgent, WorkerOptions } from "@livekit/agents";
import { AudioStream, RoomEvent, TrackKind } from "@livekit/rtc-node";

import {
  addSegment,
  completeTranscription,
  createTranscription,
  failTranscription,
} from "./db.js";
import { Transcriber } from "./transcriber.js";

const SAMPLE_RATE = 16000;
const SILENCE_THRESHOLD = 500; // ms of silence before processing
const MIN_SPEECH_DURATION = 300; // ms minimum speech to process

interface ParticipantState {
  identity: string;
  name: string;
  audioBuffer: AudioFrame[];
  lastSpeechTime: number;
  isSpeaking: boolean;
  silenceTimer: NodeJS.Timeout | null;
}

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const room = ctx.room;
    const roomName = ctx.job.room?.name;

    if (!roomName) {
      console.error("No room name available in job context");
      return;
    }

    // Room name IS the meeting ID (UUID)
    const meetingId = roomName;

    console.log(`Agent joining room: ${roomName}, meetingId: ${meetingId}`);

    const transcriber = new Transcriber(SAMPLE_RATE);
    const participantStates = new Map<string, ParticipantState>();
    let transcription: { id: string } | null = null;
    let meetingStartTime = Date.now();

    // Create transcription record
    try {
      transcription = await createTranscription(meetingId);
      console.log(`Created transcription: ${transcription?.id}`);
    } catch (error) {
      console.error("Failed to create transcription:", error);
    }

    const processAudioBuffer = async (state: ParticipantState) => {
      if (state.audioBuffer.length === 0) return;

      const duration =
        state.audioBuffer.reduce((sum, f) => sum + f.samplesPerChannel, 0) /
        SAMPLE_RATE;

      if (duration * 1000 < MIN_SPEECH_DURATION) {
        state.audioBuffer = [];
        return;
      }

      const startTime = (Date.now() - meetingStartTime) / 1000 - duration;
      const endTime = (Date.now() - meetingStartTime) / 1000;

      console.log(
        `Processing ${duration.toFixed(2)}s audio from ${state.name}`,
      );

      try {
        const result = await transcriber.transcribe(state.audioBuffer);

        if (result.text && result.text.trim() && transcription) {
          console.log(`[${state.name}]: ${result.text}`);

          await addSegment(transcription.id, {
            speakerIdentity: state.identity,
            speakerName: state.name,
            content: result.text.trim(),
            startTime,
            endTime,
          });
        }
      } catch (error) {
        console.error("Failed to process audio:", error);
      }

      state.audioBuffer = [];
    };

    const handleAudioTrack = async (
      track: RemoteTrack,
      participant: RemoteParticipant,
    ) => {
      const identity = participant.identity;
      const name = participant.name ?? identity;

      console.log(`Subscribed to audio track from: ${name} (${identity})`);

      // Initialize participant state
      const state: ParticipantState = {
        identity,
        name,
        audioBuffer: [],
        lastSpeechTime: 0,
        isSpeaking: false,
        silenceTimer: null,
      };
      participantStates.set(identity, state);

      const audioStream = new AudioStream(track, SAMPLE_RATE, 1);

      for await (const frame of audioStream) {
        // Simple VAD: check if audio has significant energy
        const samples = frame.data;
        let energy = 0;
        for (let i = 0; i < samples.length; i++) {
          energy += Math.abs(samples[i]!);
        }
        energy /= samples.length;

        const isSpeech = energy > 500; // Threshold for speech detection

        if (isSpeech) {
          state.lastSpeechTime = Date.now();
          state.isSpeaking = true;
          state.audioBuffer.push(frame);

          // Clear any pending silence timer
          if (state.silenceTimer) {
            clearTimeout(state.silenceTimer);
            state.silenceTimer = null;
          }
        } else if (state.isSpeaking) {
          // Still add frame during brief pauses
          state.audioBuffer.push(frame);

          // Set timer to process after silence threshold
          if (!state.silenceTimer) {
            state.silenceTimer = setTimeout(async () => {
              state.isSpeaking = false;
              await processAudioBuffer(state);
              state.silenceTimer = null;
            }, SILENCE_THRESHOLD);
          }
        }
      }

      // Process any remaining audio when track ends
      if (state.silenceTimer) {
        clearTimeout(state.silenceTimer);
      }
      await processAudioBuffer(state);

      participantStates.delete(identity);
      console.log(`Audio track ended for: ${name}`);
    };

    // Set up track subscription handler
    room.on(
      RoomEvent.TrackSubscribed,
      (
        track: RemoteTrack,
        _publication: unknown,
        participant: RemoteParticipant,
      ) => {
        if (track.kind === TrackKind.KIND_AUDIO) {
          handleAudioTrack(track, participant).catch(console.error);
        }
      },
    );

    // Helper to finalize and disconnect
    const finalizeAndDisconnect = async (reason: string) => {
      console.log(`${reason}, finalizing transcription`);

      // Process any remaining audio buffers
      for (const state of participantStates.values()) {
        if (state.silenceTimer) {
          clearTimeout(state.silenceTimer);
        }
        await processAudioBuffer(state);
      }

      // Mark transcription as complete
      if (transcription) {
        try {
          await completeTranscription(transcription.id);
          console.log("Transcription completed");
        } catch (error) {
          console.error("Failed to complete transcription:", error);
          await failTranscription(transcription.id, String(error)).catch(
            console.error,
          );
        }
      }
    };

    // Track if we've already finalized
    let finalized = false;

    // Track recording state to detect when it stops
    let wasRecording = true; // We're dispatched when recording starts

    // Handle room updates - check if recording stopped
    room.on(RoomEvent.RoomUpdated, async () => {
      const isRecording = room.isRecording;
      console.log(`Room updated, isRecording: ${isRecording}`);

      if (wasRecording && !isRecording && !finalized) {
        finalized = true;
        await finalizeAndDisconnect("Recording stopped");
        await room.disconnect();
      }
      wasRecording = isRecording;
    });

    // Handle room disconnect (fallback if recording wasn't stopped first)
    room.on(RoomEvent.Disconnected, async () => {
      if (!finalized) {
        finalized = true;
        await finalizeAndDisconnect("Room disconnected");
      }
    });

    // Connect to room - subscribe to audio only, don't publish
    await ctx.connect();

    console.log(`Agent connected to room: ${roomName}`);
    meetingStartTime = Date.now();

    // Handle existing participants
    for (const [, participant] of room.remoteParticipants) {
      for (const [, publication] of participant.trackPublications) {
        if (
          publication.track &&
          publication.track.kind === TrackKind.KIND_AUDIO
        ) {
          handleAudioTrack(publication.track as RemoteTrack, participant).catch(
            console.error,
          );
        }
      }
    }
  },
});

// Run the agent with explicit dispatch (won't auto-join rooms)
cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: "transcription-agent",
  }),
);
