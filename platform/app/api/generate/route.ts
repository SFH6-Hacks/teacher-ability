import { Type } from "@google/genai";
import { generateJson } from "@/lib/gemini";
import {
  DEMO_HOMEWORK_RAW,
  DEMO_HOMEWORK_TITLE,
  fallbackDeck,
  getStudent,
} from "@/lib/demo-data";
import { decks, lesson } from "@/lib/store";
import type { Deck, HomeworkCard, Profile } from "@/lib/types";

const deckSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    cards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ["concept", "mcq", "short", "steps"],
          },
          heading: { type: Type.STRING },
          body: { type: Type.STRING },
          slideRef: { type: Type.INTEGER },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
          modelPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["type"],
      },
    },
  },
  required: ["title", "cards"],
};

const PROFILE_RULES: Record<Profile, string> = {
  dyslexia: `The student has dyslexia. Keep the ORIGINAL question wording but break any long question text into short chunks of 2-3 sentences separated by blank lines (\\n\\n). Never change the meaning. Prefer "short" and "mcq" cards. Keep all card text calm and concise.`,
  adhd: `The student has ADHD. Convert EVERY written-answer question into a "steps" card that breaks it into 2-4 tiny concrete sub-steps, each a single short action. Keep concept cards very short (max 2 sentences). Alternate concept and question cards so there is a small win every card.`,
  blind: `The student is blind or low-vision and uses text-to-speech. Write in a clean linear order that reads well aloud. Never reference visual layout ("see above", "the diagram on the left"). If a slide has an image, describe it in words within the concept card body.`,
  deaf: `The student is deaf. Everything must work in writing. Start the deck with a concept card headed "From today's lesson" that recaps the key points of the lesson transcript in clear bullets, since they could not hear the teacher. Never reference audio.`,
};

type RawCard = Partial<{
  type: string;
  heading: string;
  body: string;
  slideRef: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  modelPoints: string[];
  steps: string[];
}>;

function toCard(raw: RawCard): HomeworkCard | null {
  switch (raw.type) {
    case "concept":
      return raw.heading && raw.body
        ? { type: "concept", heading: raw.heading, body: raw.body, slideRef: raw.slideRef }
        : null;
    case "mcq":
      return raw.question &&
        raw.options &&
        raw.options.length >= 2 &&
        typeof raw.correctIndex === "number" &&
        raw.correctIndex >= 0 &&
        raw.correctIndex < raw.options.length
        ? {
            type: "mcq",
            question: raw.question,
            options: raw.options,
            correctIndex: raw.correctIndex,
            explanation: raw.explanation ?? "",
          }
        : null;
    case "short":
      return raw.question
        ? { type: "short", question: raw.question, modelPoints: raw.modelPoints ?? [] }
        : null;
    case "steps":
      return raw.question && raw.steps?.length
        ? { type: "steps", question: raw.question, steps: raw.steps }
        : null;
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { studentId?: string }
    | null;
  const student = body?.studentId ? getStudent(body.studentId) : undefined;
  if (!student) {
    return Response.json({ error: "Unknown student" }, { status: 400 });
  }

  const slidesText = lesson.slides
    .map(
      (s) =>
        `Slide ${s.index} — ${s.title}: ${s.content_text}${s.image_alt ? ` [Image: ${s.image_alt}]` : ""}`,
    )
    .join("\n");

  const result = await generateJson<{ title: string; cards: RawCard[] }>({
    system: `You turn a homework worksheet into a bitesized, Seneca-style learning sequence for ONE student with a specific learning need. Interleave short "concept" recap cards (grounded ONLY in the provided lesson slides and transcript, with slideRef pointing at the slide used) with the worksheet's questions. Cover every worksheet question exactly once. 6 to 10 cards total. ${PROFILE_RULES[student.profile]}`,
    prompt: `LESSON SLIDES:\n${slidesText}\n\nLESSON TRANSCRIPT (what the teacher said):\n${lesson.transcript || "(no recording made)"}\n\nHOMEWORK WORKSHEET:\n${DEMO_HOMEWORK_RAW}\n\nStudent: ${student.name} (${student.profileLabel}).`,
    schema: deckSchema,
  });

  let deck: Deck;
  const cards = result?.cards?.map(toCard).filter((c): c is HomeworkCard => c !== null) ?? [];
  if (cards.length >= 4) {
    deck = {
      studentId: student.id,
      title: result?.title || DEMO_HOMEWORK_TITLE,
      cards,
      generatedBy: "gemini",
    };
  } else {
    deck = fallbackDeck(student.id, student.profile);
  }

  decks.set(student.id, deck);
  return Response.json({ deck });
}
