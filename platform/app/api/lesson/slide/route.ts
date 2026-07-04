import { lessonState } from "@/lib/store";

export const dynamic = "force-dynamic";

// The teacher broadcasts the current slide; students poll it. In-memory only.
export async function GET() {
  return Response.json(lessonState);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { index?: number; presenting?: boolean }
    | null;

  if (typeof body?.index === "number" && Number.isFinite(body.index)) {
    lessonState.index = Math.max(0, Math.round(body.index));
  }
  if (typeof body?.presenting === "boolean") {
    lessonState.presenting = body.presenting;
  }
  lessonState.updatedAt = Date.now();
  return Response.json(lessonState);
}
