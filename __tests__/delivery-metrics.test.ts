/**
 * @jest-environment node
 */

import { computeMetrics, paceLabel } from "@/modules/interview/utils/delivery-metrics";

describe("Delivery Metrics Suite", () => {
  it("computes words per minute from the transcript and recording length", () => {
    const transcript = Array.from({ length: 150 }, () => "word").join(" ");
    const metrics = computeMetrics(transcript, 60_000);

    expect(metrics.wordCount).toBe(150);
    expect(metrics.wordsPerMinute).toBe(150);
    expect(metrics.durationSeconds).toBe(60);
  });

  it("counts filler words case-insensitively and only on word boundaries", () => {
    const metrics = computeMetrics(
      "Um, I basically like the approach, you know, and Actually it works",
      60_000
    );

    // um, basically, like, you know, actually
    expect(metrics.fillerCount).toBe(5);
  });

  it("does not count fillers embedded inside longer words", () => {
    const metrics = computeMetrics("The alumni umbrella likely broke", 60_000);
    expect(metrics.fillerCount).toBe(0);
  });

  it("returns a stable count when called repeatedly", () => {
    const transcript = "um so uh basically yes";
    expect(computeMetrics(transcript, 60_000).fillerCount).toBe(
      computeMetrics(transcript, 60_000).fillerCount
    );
  });

  it("reports the filler rate as a percentage of words spoken", () => {
    const metrics = computeMetrics("um one two three four five six seven eight nine", 60_000);
    expect(metrics.fillerCount).toBe(1);
    expect(metrics.fillerRate).toBe(10);
  });

  it("never divides by zero for empty transcripts or zero-length recordings", () => {
    expect(computeMetrics("", 0)).toMatchObject({
      wordsPerMinute: 0,
      wordCount: 0,
      fillerRate: 0,
    });
    expect(computeMetrics("hello there", 0).wordsPerMinute).toBe(0);
  });

  it("describes the pace band rather than leaving the number unexplained", () => {
    expect(paceLabel(142)).toBe("comfortable pace");
    expect(paceLabel(95)).toContain("hesitant");
    expect(paceLabel(200)).toContain("rushed");
  });
});
