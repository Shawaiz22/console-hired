import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";

export const extractionModel = groq("openai/gpt-oss-120b");
export const evaluationModel = groq("openai/gpt-oss-120b");
export const embeddingModel = google.textEmbeddingModel("gemini-embedding-001");
