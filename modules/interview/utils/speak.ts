"use client";

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
}

let activeAudio: HTMLAudioElement | null = null;
let activeBlobUrl: string | null = null;
let activeAbortController: AbortController | null = null;
let currentPlaybackId = 0;

/**
 * Stops any currently playing or pending speech (both ElevenLabs audio element and browser SpeechSynthesis).
 */
export function stopSpeaking(): void {
  // Invalidate any in-flight async operations
  currentPlaybackId++;

  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch {
      // ignore
    }
    activeAbortController = null;
  }

  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = "";
    } catch {
      // ignore
    }
    activeAudio = null;
  }

  if (activeBlobUrl) {
    try {
      URL.revokeObjectURL(activeBlobUrl);
    } catch {
      // ignore
    }
    activeBlobUrl = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Reads text aloud using server-side ElevenLabs TTS with seamless fallback to browser SpeechSynthesis.
 * Ensures single audio stream with proper cancellation of in-flight requests.
 */
export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (!text || typeof window === "undefined") return;

  stopSpeaking();
  const playbackId = ++currentPlaybackId;

  const controller = new AbortController();
  activeAbortController = controller;

  options.onStart?.();

  // Try ElevenLabs backend TTS first
  try {
    const res = await fetch("/api/v1/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (playbackId !== currentPlaybackId) return;

    if (!res.ok) {
      throw new Error(`TTS API returned status ${res.status}`);
    }

    const blob = await res.blob();
    if (playbackId !== currentPlaybackId) return;

    const blobUrl = URL.createObjectURL(blob);
    if (playbackId !== currentPlaybackId) {
      URL.revokeObjectURL(blobUrl);
      return;
    }

    activeBlobUrl = blobUrl;
    const audio = new Audio(blobUrl);
    activeAudio = audio;

    audio.onended = () => {
      if (playbackId === currentPlaybackId) {
        stopSpeaking();
        options.onEnd?.();
      }
    };

    audio.onerror = () => {
      if (playbackId === currentPlaybackId) {
        stopSpeaking();
        fallbackBrowserSpeech(text, options, playbackId);
      }
    };

    try {
      await audio.play();
    } catch (playErr: unknown) {
      if (playbackId !== currentPlaybackId) return;
      if (playErr instanceof DOMException && playErr.name === "AbortError") {
        return;
      }
      console.info("[TTS] Audio play was blocked/failed, trying browser synthesis:", playErr);
      fallbackBrowserSpeech(text, options, playbackId);
    }
  } catch (err: unknown) {
    if (playbackId !== currentPlaybackId) return;

    // Do not trigger fallback if intentionally aborted
    if (err instanceof DOMException && err.name === "AbortError") {
      return;
    }

    console.info("[TTS] Falling back to browser SpeechSynthesis:", err);
    fallbackBrowserSpeech(text, options, playbackId);
  }
}

function fallbackBrowserSpeech(text: string, options: SpeakOptions = {}, playbackId: number): void {
  if (playbackId !== currentPlaybackId) return;

  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    options.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.lang = "en-IN";

    utterance.onend = () => {
      if (playbackId === currentPlaybackId) {
        options.onEnd?.();
      }
    };

    utterance.onerror = (e) => {
      if (playbackId === currentPlaybackId) {
        console.warn("[SpeechSynthesis] error:", e);
        options.onError?.(e);
        options.onEnd?.();
      }
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    if (playbackId === currentPlaybackId) {
      console.warn("[SpeechSynthesis] speak failed:", err);
      options.onError?.(err);
      options.onEnd?.();
    }
  }
}
