export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type PostureStatus = "UPRIGHT" | "LEANING_LEFT" | "LEANING_RIGHT" | "SLOUCHING";
export type MovementStatus = "STABLE" | "MODERATE" | "EXCESSIVE";
export type PositionStatus = "CENTERED" | "OFF_CENTER" | "TOO_CLOSE" | "TOO_FAR" | "NOT_VISIBLE";

export interface VideoAnalysisFrameResult {
  isPersonVisible: boolean;
  postureStatus: PostureStatus;
  postureScore: number;
  movementStatus: MovementStatus;
  movementScore: number;
  positionStatus: PositionStatus;
  positionScore: number;
  overallPresenceScore: number;
  warningMessage: string | null;
}

export interface VideoMetricsSummary {
  durationSeconds: number;
  personVisibilityPercent: number;
  postureScore: number;
  movementScore: number;
  cameraPositionScore: number;
  professionalPresenceScore: number;
  warnings: Array<{ type: string; durationSeconds: number }>;
}
