import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";

export const extractionModel = google("gemini-2.5-flash");
export const evaluationModel = groq("openai/gpt-oss-20b", { structuredOutputs: false });
export const embeddingModel = google.textEmbeddingModel("text-embedding-004");
