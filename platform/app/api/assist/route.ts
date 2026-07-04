import { Type } from "@google/genai";
import { generateJson } from "@/lib/gemini";
import { lesson } from "@/lib/store";
import type { WalkthroughStep } from "@/lib/types";

const walkthroughSchema = {
  type: Type.OBJECT,
  properties: {
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          say: { type: Type.STRING },
          spot: { type: Type.STRING },
          draw: { type: Type.STRING, enum: ["circle", "underline", "arrow"] },
        },
        required: ["say"],
      },
    },
  },
  required: ["steps"],
};

const SYSTEM = `You are a friendly homework helper that lives next to a student's cursor. You guide their thinking with a short multi-step walkthrough — you NEVER give the answer.

HARD RULES:
- Never state or strongly imply the final answer.
- Never eliminate multiple-choice options down to one.
- If the student asks directly for the answer, warmly refuse and redirect them to think ("I can't just tell you — but let's work it out together").
- Ground every hint ONLY in the provided lesson content. When you use a slide, mention it naturally ("Remember slide 2...").
- 2 to 4 steps. Each step's "say" is 1-2 short, encouraging sentences a child can read.
- Each step MAY include "spot": the id of one on-screen element from the SPOTS list that the student should look at, and "draw": how to mark it (circle, underline or arrow). Use spots on most steps — pointing at the screen is your superpower.
- Escalate gently across the walkthrough: step 1 reframes the question, later steps point toward the relevant concept.
- If this is the student's 3rd request (assistNumber 3), make the final step encourage them to try alone or ask their teacher.`;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    question?: string;
    card?: unknown;
    profile?: string;
    spots?: { id: string; text: string }[];
    assistNumber?: number;
  } | null;

  if (!body?.card) {
    return Response.json({ error: "Missing card" }, { status: 400 });
  }

  const slidesText = lesson.slides
    .map((s) => `Slide ${s.index} — ${s.title}: ${s.content_text}`)
    .join("\n");
  const spotsText = (body.spots ?? [])
    .map((s) => `- ${s.id}: "${s.text}"`)
    .join("\n");

  const result = await generateJson<{ steps: WalkthroughStep[] }>({
    system: SYSTEM,
    prompt: `LESSON CONTENT:\n${slidesText}\n\nTEACHER TRANSCRIPT:\n${lesson.transcript || "(none)"}\n\nCURRENT CARD (JSON):\n${JSON.stringify(body.card)}\n\nSPOTS on screen you can point at:\n${spotsText}\n\nStudent profile: ${body.profile ?? "unknown"}\nAssist number: ${body.assistNumber ?? 1} of 3\nStudent says: "${(body.question ?? "I'm stuck").slice(0, 500)}"`,
    schema: walkthroughSchema,
  });

  const steps = (result?.steps ?? []).filter((s) => s.say).slice(0, 4);
  if (!steps.length) {
    // Companion has its own client-side fallback; signal failure honestly.
    return Response.json({ error: "assist unavailable" }, { status: 503 });
  }
  return Response.json({ steps });
}
