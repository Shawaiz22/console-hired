import { generateObject } from "ai";
import { extractionModel } from "@/lib/ai";
import { DeliveryAnalysisSchema, type DeliveryAnalysis } from "../schemas/interview.schema";
import { deliveryPrompt } from "./prompts";

/**
 * Sends the raw recording to Gemini for a delivery judgement.
 *
 * This is the multimodal half of the grading: content comes from the transcript via
 * Groq, delivery comes from the audio via Gemini. Throws on failure — the caller is
 * responsible for treating that as a missing section, never a failed submission.
 */
export async function analyzeDelivery(
  base64Audio: string,
  question: string
): Promise<DeliveryAnalysis> {
  const { object } = await generateObject({
    model: extractionModel,
    schema: DeliveryAnalysisSchema,
    messages: [
      {
        role: "user",
        content: [
          { type: "file", data: base64Audio, mediaType: "audio/webm" },
          { type: "text", text: deliveryPrompt(question) },
        ],
      },
    ],
  });

  return object;
}
