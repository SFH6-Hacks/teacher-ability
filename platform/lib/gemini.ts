import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 25_000;

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI | null {
  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    console.warn("GOOGLE_CLOUD_PROJECT is not set for Vertex AI ADC.");
    return null;
  }
  return (client ??= new GoogleGenAI({
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    vertexai: true,
  } as any));
}

/**
 * Call Gemini with structured JSON output. Returns null on any failure
 * (no key, timeout, bad JSON) — callers must fall back to canned data.
 */
export async function generateJson<T>(opts: {
  system: string;
  prompt: string;
  schema: object;
}): Promise<T | null> {
  const ai = getClient();
  if (!ai) return null;
  try {
    const result = await Promise.race([
      ai.models.generateContent({
        model: MODEL,
        contents: opts.prompt,
        config: {
          systemInstruction: opts.system,
          responseMimeType: "application/json",
          responseSchema: opts.schema,
          temperature: 0.4,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("gemini timeout")), TIMEOUT_MS),
      ),
    ]);
    const text = result.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("[gemini]", err instanceof Error ? err.message : err);
    return null;
  }
}

export type MultimodalPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

/**
 * Multimodal variant of generateJson — accepts text + inline image parts
 * (e.g. a screenshot of the student's screen). Same null-on-failure contract.
 */
export async function generateJsonMultimodal<T>(opts: {
  system: string;
  parts: MultimodalPart[];
  schema: object;
}): Promise<T | null> {
  const ai = getClient();
  if (!ai) return null;
  try {
    const result = await Promise.race([
      ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: opts.parts }],
        config: {
          systemInstruction: opts.system,
          responseMimeType: "application/json",
          responseSchema: opts.schema,
          temperature: 0.4,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("gemini timeout")), TIMEOUT_MS),
      ),
    ]);
    const text = result.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("[gemini]", err instanceof Error ? err.message : err);
    return null;
  }
}
