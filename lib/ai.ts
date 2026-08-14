import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";

export const extractionModel = google("gemini-2.5-flash");
export const evaluationModel = groq("llama-3.3-70b-versatile");
export const embeddingModel = google.textEmbeddingModel("text-embedding-004");
