import { submissions } from "@/lib/store";
import { getClassMember } from "@/lib/demo-data";
import { isConnected } from "@/lib/types";

// A student hands in their completed homework. Pure state — no grading, no
// Gemini call. Answers are keyed by card index (as strings, from JSON).
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { studentId?: string; answers?: Record<string, string> }
    | null;

  const member = body?.studentId ? getClassMember(body.studentId) : undefined;
  if (!member || !isConnected(member)) {
    return Response.json({ error: "Unknown student" }, { status: 400 });
  }

  submissions.set(member.id, {
    studentId: member.id,
    answers: body?.answers ?? {},
    submittedAt: Date.now(),
  });
  return Response.json({ ok: true });
}
