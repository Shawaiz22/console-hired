"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { speak, stopSpeaking } from "../utils/speak";

const MUTE_STORAGE_KEY = "console_hired_interview_muted";

const muteStore = {
  subscribe(callback: () => void) {
    if (typeof window === "undefined") return () => {};
    window.addEventListener("storage", callback);
    window.addEventListener("console_hired_mute_change", callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener("console_hired_mute_change", callback);
    };
  },
  getSnapshot(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  },
  getServerSnapshot(): boolean {
    return false;
  },
  setMuted(muted: boolean) {
    if (typeof window !== "undefined") {
      localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
      window.dispatchEvent(new Event("console_hired_mute_change"));
    }
  },
};

export function useAudioPlayer() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isMuted = useSyncExternalStore(
    muteStore.subscribe,
    muteStore.getSnapshot,
    muteStore.getServerSnapshot
  );

  const toggleMute = useCallback(() => {
    const next = !muteStore.getSnapshot();
    muteStore.setMuted(next);
    if (next) {
      stopSpeaking();
      setIsSpeaking(false);
    }
  }, []);

  const playText = useCallback(
    async (text: string, force = false) => {
      if ((isMuted && !force) || !text) return;

      setIsSpeaking(true);
      try {
        await speak(text, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      } catch {
        setIsSpeaking(false);
      }
    },
    [isMuted]
  );

  const stop = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    isMuted,
    toggleMute,
    playText,
    stop,
  };
}
