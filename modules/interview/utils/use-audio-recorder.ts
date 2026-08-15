"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type CapturedAudio = { base64: string; durationMs: number };

/** Runaway recordings bloat the request body; stop the take rather than truncate it later. */
const MAX_RECORDING_MS = 3 * 60 * 1000;
const MIME_TYPE = "audio/webm";

const emptySubscribe = () => () => {};

function detectSupport() {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  return MediaRecorder.isTypeSupported(MIME_TYPE);
}

/**
 * Records the microphone alongside `useSpeech`, which transcribes the same take.
 *
 * `useSpeech` uses the Web Speech API, which owns the microphone internally and never
 * exposes a MediaStream, so there is no stream to share — this hook opens its own.
 * The browser only prompts once per origin, so the candidate still sees a single prompt.
 *
 * Audio capture is strictly supplementary: every failure path returns null and lets the
 * text answer proceed.
 */
export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const resolveRef = useRef<((audio: CapturedAudio | null) => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Holds the in-flight result when the 3-minute cap stops the recorder before submit
  const pendingRef = useRef<Promise<CapturedAudio | null> | null>(null);

  const supported = useSyncExternalStore(emptySubscribe, detectSupport, () => false);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Stops the recorder and resolves once `onstop` has encoded the blob. */
  const finalize = useCallback((): Promise<CapturedAudio | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return Promise.resolve(null);

    const settled = new Promise<CapturedAudio | null>((resolve) => {
      resolveRef.current = resolve;
    });

    try {
      recorder.stop();
    } catch (err) {
      console.warn("[useAudioRecorder] failed to stop recorder:", err);
      resolveRef.current = null;
      releaseStream();
      setRecording(false);
      return Promise.resolve(null);
    }

    return settled;
  }, [releaseStream]);

  const start = useCallback(async (): Promise<boolean> => {
    if (!detectSupport()) return false;
    if (recorderRef.current && recorderRef.current.state !== "inactive") return true;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      // Denied permission or no input device: the transcript path continues without us
      console.warn("[useAudioRecorder] microphone unavailable:", err);
      return false;
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType: MIME_TYPE });

      chunksRef.current = [];
      pendingRef.current = null;
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        clearTimer();
        const durationMs = Date.now() - startedAtRef.current;

        let captured: CapturedAudio | null = null;
        try {
          const blob = new Blob(chunksRef.current, { type: MIME_TYPE });
          if (blob.size > 0) {
            captured = { base64: await blobToBase64(blob), durationMs };
          }
        } catch (err) {
          console.warn("[useAudioRecorder] failed to encode recording:", err);
        }

        chunksRef.current = [];
        releaseStream();
        setRecording(false);

        const resolve = resolveRef.current;
        resolveRef.current = null;
        resolve?.(captured);
      };

      recorder.onerror = (event) => {
        console.warn("[useAudioRecorder] recorder error:", event);
      };

      recorder.start();
      recorderRef.current = recorder;
      streamRef.current = stream;
      setRecording(true);

      timerRef.current = setTimeout(() => {
        pendingRef.current = finalize();
      }, MAX_RECORDING_MS);

      return true;
    } catch (err) {
      console.warn("[useAudioRecorder] failed to start recording:", err);
      stream.getTracks().forEach((track) => track.stop());
      return false;
    }
  }, [clearTimer, finalize, releaseStream]);

  const stop = useCallback((): Promise<CapturedAudio | null> => {
    clearTimer();

    // The duration cap already stopped us; hand back that take rather than a null
    if (pendingRef.current) {
      const pending = pendingRef.current;
      pendingRef.current = null;
      return pending;
    }

    return finalize();
  }, [clearTimer, finalize]);

  /** Drop the take without encoding it — used when the mic is toggled back off. */
  const cancel = useCallback(() => {
    clearTimer();
    pendingRef.current = null;
    resolveRef.current = null;

    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        // already stopping
      }
    }

    chunksRef.current = [];
    recorderRef.current = null;
    releaseStream();
    setRecording(false);
  }, [clearTimer, releaseStream]);

  // Never leave the microphone open behind a closed view
  useEffect(() => cancel, [cancel]);

  return { recording, supported, start, stop, cancel };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
