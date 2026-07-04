import { Type } from "@google/genai";
import { generateJson } from "@/lib/gemini";

const verdictSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, enum: ["pass", "close", "retry"] },
    say: { type: Type.STRING },
  },
  required: ["verdict", "say"],
};

const SYSTEM = `You are a lenient, child-friendly judge checking a student's answer to a tiny comprehension question from their homework helper.

RULES:
- Be generous: accept paraphrases, synonyms, misspellings and partial understanding. If the core idea is there, verdict is "pass".
- "close" = they're circling the idea but missing a key part. "retry" = off track.
- NEVER reveal or hint at the expected answer in "say".
- "say" is ONE short, warm, encouraging sentence a child can read (max ~12 words).`;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    question?: string;
    expected?: string;
    answer?: string;
    profile?: string;
  } | null;

  if (!body?.question || !body?.expected || typeof body.answer !== "string") {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const result = await generateJson<{
    verdict: "pass" | "close" | "retry";
    say: string;
  }>({
    system: SYSTEM,
    prompt: `Question asked: "${body.question.slice(0, 300)}"
Expected answer (SECRET — never reveal): "${body.expected.slice(0, 300)}"
Student profile: ${body.profile ?? "unknown"}
Student's answer: "${body.answer.slice(0, 500)}"`,
    schema: verdictSchema,
  });

  if (!result?.verdict || !result.say) {
    return Response.json({ error: "check unavailable" }, { status: 503 });
  }
  return Response.json({ verdict: result.verdict, say: result.say });
}
