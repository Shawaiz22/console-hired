"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export interface ISpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

export interface ISpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

export interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognitionInstance;
}

export interface WindowWithSpeech extends Window {
  SpeechRecognition?: ISpeechRecognitionConstructor;
  webkitSpeechRecognition?: ISpeechRecognitionConstructor;
}

export interface UseSpeechOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

const emptySubscribe = () => () => {};

export function useSpeech(onText: (text: string) => void, options: UseSpeechOptions = {}) {
  const { lang = "en-IN", continuous = true, interimResults = true } = options;
  const [listening, setListening] = useState(false);
  const recRef = useRef<ISpeechRecognitionInstance | null>(null);
  const onTextRef = useRef(onText);

  // Safely check browser support across SSR and hydration
  const supported = useSyncExternalStore(
    emptySubscribe,
    () => {
      if (typeof window === "undefined") return false;
      const win = window as unknown as WindowWithSpeech;
      return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
    },
    () => false
  );

  // Keep latest callback reference
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const stop = useCallback(() => {
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        // Ignore errors when stopping already stopped instance
      }
      recRef.current = null;
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;

    const win = window as unknown as WindowWithSpeech;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SR) {
      return;
    }

    // Stop any existing instance
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        // ignore
      }
    }

    try {
      const rec = new SR();
      rec.continuous = continuous;
      rec.interimResults = interimResults;
      rec.lang = lang;

      rec.onresult = (event: ISpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (onTextRef.current) {
          onTextRef.current(transcript);
        }
      };

      rec.onerror = (err: ISpeechRecognitionErrorEvent) => {
        console.warn("[useSpeech] recognition error:", err?.error || err);
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch (err) {
      console.warn("[useSpeech] failed to start recognition:", err);
      setListening(false);
    }
  }, [continuous, interimResults, lang]);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recRef.current) {
        try {
          recRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    listening,
    supported,
    start,
    stop,
    toggle,
  };
}
