import { Type } from "@google/genai";
import { generateJson } from "@/lib/gemini";
import { BACKUP_SUMMARY } from "@/lib/demo-data";
import { lesson } from "@/lib/store";

const summarySchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["summary"],
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    transcript?: string;
  } | null;
  const transcript = body?.transcript?.trim();
  if (!transcript) {
    return Response.json({ error: "Missing transcript" }, { status: 400 });
  }

  lesson.transcript = transcript.slice(0, 20_000);

  const result = await generateJson<{ summary: string[] }>({
    system:
      "Summarize this teacher's lesson transcript into 2-4 short bullet points a student can read at a glance. Plain language, one idea per bullet, no jargon. The transcript comes from live speech-to-text so ignore noise and repetition.",
    prompt: lesson.transcript,
    schema: summarySchema,
  });

  lesson.summary = result?.summary?.length ? result.summary : BACKUP_SUMMARY;
  return Response.json({ summary: lesson.summary });
}
