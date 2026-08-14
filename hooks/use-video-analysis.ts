"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { evaluateFrame, MotionTracker } from "@/modules/video/utils/metrics";
import { getPoseLandmarker } from "@/modules/video/utils/pose";
import { VideoAnalysisFrameResult } from "@/modules/video/utils/types";

export interface UseVideoAnalysisReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  cameraActive: boolean;
  permissionError: string | null;
  analysis: VideoAnalysisFrameResult;
  stopCamera: () => void;
  startCamera: () => Promise<void>;
}

const initialAnalysis: VideoAnalysisFrameResult = {
  isPersonVisible: false,
  postureStatus: "UPRIGHT",
  postureScore: 0,
  movementStatus: "STABLE",
  movementScore: 0,
  positionStatus: "NOT_VISIBLE",
  positionScore: 0,
  overallPresenceScore: 0,
  warningMessage: null,
};

export function useVideoAnalysis(enabled = true): UseVideoAnalysisReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysisFrameResult>(initialAnalysis);

  const motionTrackerRef = useRef<MotionTracker>(new MotionTracker());

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setPermissionError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false, // Fahad owns audio/microphone — video module explicitly sets false
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(console.warn);
      }
    } catch (err) {
      console.warn("[useVideoAnalysis] Camera access error:", err);
      setCameraActive(false);
      setPermissionError(
        "Camera access required for video analysis. Please check browser permissions."
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    if (enabled) {
      void (async () => {
        if (mounted) {
          await startCamera();
        }
      })();
    } else {
      queueMicrotask(() => {
        if (mounted) {
          stopCamera();
        }
      });
    }

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [enabled, startCamera, stopCamera]);

  // Frame detection loop (throttled at ~10 FPS for performance)
  useEffect(() => {
    if (!cameraActive || !videoRef.current) return;

    let animId: number;
    let lastTime = 0;
    const intervalMs = 100; // 10 FPS

    async function processFrame(now: number) {
      if (now - lastTime >= intervalMs && videoRef.current && videoRef.current.readyState >= 2) {
        lastTime = now;
        try {
          const landmarker = await getPoseLandmarker();
          if (landmarker) {
            const results = landmarker.detectForVideo(videoRef.current, now);
            const rawLandmarks = results.landmarks[0] ?? null;

            const frameResult = evaluateFrame(rawLandmarks, motionTrackerRef.current);
            setAnalysis(frameResult);
          }
        } catch (err) {
          console.warn("[useVideoAnalysis] Frame analysis error:", err);
        }
      }

      animId = requestAnimationFrame(processFrame);
    }

    animId = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cameraActive]);

  return {
    videoRef,
    stream,
    cameraActive,
    permissionError,
    analysis,
    stopCamera,
    startCamera,
  };
}
