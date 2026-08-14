import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";

const TtsRequestSchema = z.object({
  text: z.string().trim().min(1, "Text is required").max(2000, "Text is too long"),
  voiceId: z.string().trim().optional(),
});

// Default ElevenLabs voice (George - crisp, professional interviewer)
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

// Server-side in-memory audio cache to conserve ElevenLabs quota
const audioCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const MAX_CACHE_SIZE = 100;

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = TtsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { text, voiceId = DEFAULT_VOICE_ID } = parsed.data;
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs API key is not configured on server" },
      { status: 503 }
    );
  }

  // Check cache first
  const cacheKey = `${voiceId}:${text}`;
  const cached = audioCache.get(cacheKey);
  if (cached) {
    return new Response(new Uint8Array(cached.buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(`[TTS-ElevenLabs] Failed with status ${response.status}: ${errorText}`);
      return NextResponse.json({ error: "ElevenLabs speech synthesis failed" }, { status: 503 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Store in cache (LRU eviction if limit reached)
    if (audioCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = audioCache.keys().next().value;
      if (oldestKey) audioCache.delete(oldestKey);
    }
    audioCache.set(cacheKey, { buffer, timestamp: Date.now() });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("[TTS-ElevenLabs] Network or server error:", err);
    return NextResponse.json({ error: "Internal TTS error" }, { status: 503 });
  }
}
