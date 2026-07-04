import { Type } from "@google/genai";
import { generateJsonMultimodal, type MultimodalPart } from "@/lib/gemini";
import { lesson } from "@/lib/store";
import type { HelpPlan, HelpPointer, HelpStep, PointerEnd } from "@/lib/types";

// ---------------------------------------------------------------------------
// Response schema — everything is a FLAT object (Gemini structured output
// does not support unions/oneOf), mirroring the HelpPlan types in lib/types.
// ---------------------------------------------------------------------------

const pointerEndSchema = {
  type: Type.OBJECT,
  properties: {
    spot: { type: Type.STRING },
    x: { type: Type.NUMBER },
    y: { type: Type.NUMBER },
  },
};

const pointerSchema = {
  type: Type.OBJECT,
  properties: {
    kind: {
      type: Type.STRING,
      enum: ["arrow-straight", "arrow-curved", "region", "circle", "underline"],
    },
    targetSpot: { type: Type.STRING },
    from: pointerEndSchema,
    to: pointerEndSchema,
    rect: {
      type: Type.OBJECT,
      properties: {
        x1: { type: Type.NUMBER },
        y1: { type: Type.NUMBER },
        x2: { type: Type.NUMBER },
        y2: { type: Type.NUMBER },
      },
    },
  },
  required: ["kind"],
};

const shapeSchema = {
  type: Type.OBJECT,
  properties: {
    kind: {
      type: Type.STRING,
      enum: ["line", "polygon", "circle", "text", "angle-mark"],
    },
    x1: { type: Type.NUMBER },
    y1: { type: Type.NUMBER },
    x2: { type: Type.NUMBER },
    y2: { type: Type.NUMBER },
    points: { type: Type.ARRAY, items: { type: Type.NUMBER } },
    cx: { type: Type.NUMBER },
    cy: { type: Type.NUMBER },
    r: { type: Type.NUMBER },
    x: { type: Type.NUMBER },
    y: { type: Type.NUMBER },
    text: { type: Type.STRING },
    startDeg: { type: Type.NUMBER },
    endDeg: { type: Type.NUMBER },
    label: { type: Type.STRING },
  },
  required: ["kind"],
};

const diagramSchema = {
  type: Type.OBJECT,
  properties: {
    kind: { type: Type.STRING, enum: ["svg-spec"] },
    width: { type: Type.NUMBER },
    height: { type: Type.NUMBER },
    title: { type: Type.STRING },
    shapes: { type: Type.ARRAY, items: shapeSchema },
  },
  required: ["kind", "width", "height", "shapes"],
};

const gateSchema = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      enum: ["hover-target", "click-target", "mini-check", "got-it"],
    },
    question: { type: Type.STRING },
    expected: { type: Type.STRING },
  },
  required: ["type"],
};

const planSchema = {
  type: Type.OBJECT,
  properties: {
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          say: { type: Type.STRING },
          pointer: pointerSchema,
          diagram: diagramSchema,
          gate: gateSchema,
        },
        required: ["say", "gate"],
      },
    },
    mood: {
      type: Type.STRING,
      enum: ["encouraging", "concerned", "celebratory"],
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

SEEING THE SCREEN:
- You can see a screenshot of the student's screen plus an ELEMENT REGISTRY of on-screen regions with ids and pixel rects. Point at elements via pointer.targetSpot using registry ids. Only use raw x/y coordinates for arrow endpoints when connecting two elements or pointing from empty space; coordinates are viewport pixels matching the registry rects.

PLAN FORMAT:
- Return 2-4 steps. Each say is ONE short encouraging sentence (max ~12 words). Most steps should include a pointer. kinds: circle/underline/region highlight one element (region = box over its rect); arrow-straight/arrow-curved connect from→to (spots or coords).
- Include a diagram ONLY when a picture genuinely teaches the concept (forces, geometry, e.g. two labeled force arrows on a book and table). Diagram has its own width×height coordinate space (~400×300), ≤8 shapes, label key parts.
- Every step has a gate: hover-target/click-target (student must move mouse to / click that registry element — use for 'look here / click this'), mini-check (one tiny question + short expected answer — use after explaining something), got-it otherwise.

PROFILE RULES:
- blind: no pointers or diagrams; gates only mini-check/got-it; every sentence fully self-describing (never "look here").
- deaf: prefer pointers and diagrams; never reference sound or listening.
- dyslexia: very short, simple words.
- adhd: exactly one action per step; make the final step celebratory.

If this is the student's 3rd request (assistNumber 3), make the final step encourage them to try alone or ask their teacher.`;

interface RequestBody {
  question?: string;
  reason?: string;
  card?: unknown;
  profile?: string;
  registry?: {
    id: string;
    role?: string;
    text?: string;
    rect?: { x: number; y: number; w: number; h: number };
  }[];
  viewport?: { w: number; h: number };
  imageBase64?: string;
  assistNumber?: number;
}

function validEnd(
  end: PointerEnd | undefined,
  ids: Set<string>,
  vw: number,
  vh: number,
): boolean {
  if (!end) return true; // absent is fine (defaults apply client-side)
  if (end.spot) return ids.has(end.spot);
  if (typeof end.x === "number" && typeof end.y === "number") {
    return end.x >= 0 && end.x <= vw && end.y >= 0 && end.y <= vh;
  }
  return false;
}

function sanitizePointer(
  pointer: HelpPointer | undefined,
  ids: Set<string>,
  vw: number,
  vh: number,
): HelpPointer | undefined {
  if (!pointer?.kind) return undefined;
  if (pointer.targetSpot && !ids.has(pointer.targetSpot)) return undefined;
  if (pointer.kind === "arrow-straight" || pointer.kind === "arrow-curved") {
    if (!validEnd(pointer.from, ids, vw, vh)) return undefined;
    if (!validEnd(pointer.to, ids, vw, vh)) return undefined;
    if (!pointer.to && !pointer.targetSpot) return undefined; // nowhere to point
  } else if (pointer.kind !== "region" && !pointer.targetSpot) {
    return undefined; // circle/underline need a target
  }
  if (pointer.kind === "region" && !pointer.targetSpot && !pointer.rect) {
    return undefined;
  }
  return pointer;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  if (!body?.card) {
    return Response.json({ error: "Missing card" }, { status: 400 });
  }

  const registry = body.registry ?? [];
  const ids = new Set(registry.map((r) => r.id));
  const vw = body.viewport?.w ?? 1920;
  const vh = body.viewport?.h ?? 1080;

  const slidesText = lesson.slides
    .map((s) => `Slide ${s.index} — ${s.title}: ${s.content_text}`)
    .join("\n");

  const contextText = `LESSON CONTENT:
${slidesText}

TEACHER TRANSCRIPT:
${lesson.transcript || "(none)"}

CURRENT CARD (JSON):
${JSON.stringify(body.card)}

ELEMENT REGISTRY (id, role, text, rect in viewport px):
${JSON.stringify(registry)}

Viewport: ${vw}x${vh}
Student profile: ${body.profile ?? "unknown"}
Assist number: ${body.assistNumber ?? 1} of 3
${body.reason ? `Why the helper stepped in: the student looks stuck (${body.reason}).` : ""}
Student says: "${(body.question ?? "I'm stuck on this question.").slice(0, 500)}"`;

  const parts: MultimodalPart[] = [
    { text: contextText },
    ...(body.imageBase64
      ? [{ inlineData: { mimeType: "image/jpeg", data: body.imageBase64 } }]
      : []),
  ];

  const result = await generateJsonMultimodal<HelpPlan>({
    system: SYSTEM,
    parts,
    schema: planSchema,
  });

  if (!result?.steps?.length) {
    return Response.json({ error: "assist unavailable" }, { status: 503 });
  }

  const steps: HelpStep[] = result.steps
    .filter((s) => typeof s?.say === "string" && s.say.trim())
    .slice(0, 4)
    .map((s) => {
      const pointer = sanitizePointer(s.pointer, ids, vw, vh);
      const diagram =
        s.diagram && s.diagram.shapes && s.diagram.shapes.length <= 8
          ? s.diagram
          : undefined;
      let gate = s.gate?.type ? s.gate : { type: "got-it" as const };
      if (gate.type === "mini-check" && (!gate.question || !gate.expected)) {
        gate = { type: "got-it" };
      }
      return {
        say: s.say.trim(),
        ...(pointer ? { pointer } : {}),
        ...(diagram ? { diagram } : {}),
        gate,
      };
    });

  if (!steps.length) {
    return Response.json({ error: "assist unavailable" }, { status: 503 });
  }

  return Response.json({ plan: { steps, mood: result.mood } satisfies HelpPlan });
}
