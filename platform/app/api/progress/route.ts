import { getStudent } from "@/lib/demo-data";
import { getProgress, recordAssist, recordCardDone } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (!studentId || !getStudent(studentId)) {
    return Response.json({ error: "Unknown student" }, { status: 400 });
  }
  return Response.json(getProgress(studentId));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    studentId?: string;
    event?: "card-done" | "assist";
    cardIndex?: number;
    totalCards?: number;
  } | null;

  if (!body?.studentId || !getStudent(body.studentId)) {
    return Response.json({ error: "Unknown student" }, { status: 400 });
  }

  if (body.event === "card-done" && body.cardIndex !== undefined) {
    return Response.json(
      recordCardDone(body.studentId, body.cardIndex, body.totalCards ?? 0),
    );
  }
  if (body.event === "assist") {
    return Response.json(recordAssist(body.studentId, body.cardIndex));
  }
  return Response.json({ error: "Unknown event" }, { status: 400 });
}
