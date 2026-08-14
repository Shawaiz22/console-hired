import {
  MovementStatus,
  PositionStatus,
  PostureStatus,
  PoseLandmark,
  VideoAnalysisFrameResult,
} from "./types";

// Landmark indices for MediaPipe Pose (33 landmarks model)
export const LANDMARK = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
};

export class MotionTracker {
  private history: PoseLandmark[][] = [];
  private readonly maxHistory = 15;

  public addFrame(landmarks: PoseLandmark[]): void {
    this.history.push(landmarks);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  public reset(): void {
    this.history = [];
  }

  public calculateMovementScore(): { score: number; status: MovementStatus } {
    if (this.history.length < 3) {
      return { score: 100, status: "STABLE" };
    }

    let totalDisplacement = 0;
    let comparisons = 0;

    for (let i = 1; i < this.history.length; i++) {
      const prev = this.history[i - 1];
      const curr = this.history[i];

      const prevNose = prev[LANDMARK.NOSE];
      const currNose = curr[LANDMARK.NOSE];
      const prevLSh = prev[LANDMARK.LEFT_SHOULDER];
      const currLSh = curr[LANDMARK.LEFT_SHOULDER];
      const prevRSh = prev[LANDMARK.RIGHT_SHOULDER];
      const currRSh = curr[LANDMARK.RIGHT_SHOULDER];

      if (prevNose && currNose && prevLSh && currLSh && prevRSh && currRSh) {
        const dNose = Math.hypot(currNose.x - prevNose.x, currNose.y - prevNose.y);
        const dLSh = Math.hypot(currLSh.x - prevLSh.x, currLSh.y - prevLSh.y);
        const dRSh = Math.hypot(currRSh.x - prevRSh.x, currRSh.y - prevRSh.y);

        const frameDisp = (dNose + dLSh + dRSh) / 3;
        totalDisplacement += frameDisp;
        comparisons++;
      }
    }

    if (comparisons === 0) return { score: 100, status: "STABLE" };

    const avgDisp = totalDisplacement / comparisons;
    // Map average displacement (0.001 - 0.05) into score 0-100
    const rawPenalty = Math.min(100, Math.round(avgDisp * 2500));
    const score = Math.max(0, 100 - rawPenalty);

    let status: MovementStatus = "STABLE";
    if (score < 60) status = "EXCESSIVE";
    else if (score < 80) status = "MODERATE";

    return { score, status };
  }
}

export function evaluateFrame(
  landmarks: PoseLandmark[] | null,
  motionTracker: MotionTracker
): VideoAnalysisFrameResult {
  if (!landmarks || landmarks.length < 25) {
    return {
      isPersonVisible: false,
      postureStatus: "UPRIGHT",
      postureScore: 0,
      movementStatus: "STABLE",
      movementScore: 0,
      positionStatus: "NOT_VISIBLE",
      positionScore: 0,
      overallPresenceScore: 0,
      warningMessage: "Candidate not detected in camera frame",
    };
  }

  const nose = landmarks[LANDMARK.NOSE];
  const leftSh = landmarks[LANDMARK.LEFT_SHOULDER];
  const rightSh = landmarks[LANDMARK.RIGHT_SHOULDER];

  const isVisible =
    !!nose && !!leftSh && !!rightSh && (nose.visibility === undefined || nose.visibility > 0.4);

  if (!isVisible) {
    return {
      isPersonVisible: false,
      postureStatus: "UPRIGHT",
      postureScore: 0,
      movementStatus: "STABLE",
      movementScore: 0,
      positionStatus: "NOT_VISIBLE",
      positionScore: 0,
      overallPresenceScore: 0,
      warningMessage: "Please align yourself in front of the camera",
    };
  }

  // 1. Posture Score & Status
  const shoulderYDiff = leftSh.y - rightSh.y; // Positive = left lower, negative = right lower
  const absYDiff = Math.abs(shoulderYDiff);

  let postureStatus: PostureStatus = "UPRIGHT";
  if (shoulderYDiff > 0.08) postureStatus = "LEANING_LEFT";
  else if (shoulderYDiff < -0.08) postureStatus = "LEANING_RIGHT";
  else if (leftSh.y > 0.75 || rightSh.y > 0.75) postureStatus = "SLOUCHING";

  const posturePenalty = Math.min(60, Math.round(absYDiff * 400));
  const postureScore = Math.max(40, 100 - posturePenalty);

  // 2. Position & Framing Score
  const centerX = (leftSh.x + rightSh.x) / 2;
  const shoulderWidth = Math.abs(leftSh.x - rightSh.x);

  let positionStatus: PositionStatus = "CENTERED";
  let positionPenalty = 0;

  if (centerX < 0.35 || centerX > 0.65) {
    positionStatus = "OFF_CENTER";
    positionPenalty += 30;
  }
  if (shoulderWidth < 0.15) {
    positionStatus = "TOO_FAR";
    positionPenalty += 20;
  } else if (shoulderWidth > 0.6) {
    positionStatus = "TOO_CLOSE";
    positionPenalty += 20;
  }

  const positionScore = Math.max(30, 100 - positionPenalty);

  // 3. Movement Score
  motionTracker.addFrame(landmarks);
  const { score: movementScore, status: movementStatus } = motionTracker.calculateMovementScore();

  // 4. Weighted Professional Presence Score
  const overallPresenceScore = Math.round(
    postureScore * 0.35 + positionScore * 0.25 + movementScore * 0.25 + 100 * 0.15
  );

  let warningMessage: string | null = null;
  if (positionStatus === "OFF_CENTER") {
    warningMessage = "Try to remain centered in the camera view";
  } else if (postureStatus === "LEANING_LEFT" || postureStatus === "LEANING_RIGHT") {
    warningMessage = "Maintain an upright seated posture";
  } else if (movementStatus === "EXCESSIVE") {
    warningMessage = "Try to keep steady posture while speaking";
  }

  return {
    isPersonVisible: true,
    postureStatus,
    postureScore,
    movementStatus,
    movementScore,
    positionStatus,
    positionScore,
    overallPresenceScore,
    warningMessage,
  };
}
