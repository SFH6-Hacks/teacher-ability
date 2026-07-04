import { decks, submissions } from "@/lib/store";
import { fallbackDeck, getClassMember, questionText } from "@/lib/demo-data";
import { isConnected } from "@/lib/types";

export const dynamic = "force-dynamic";

// What the teacher reads: every hand-in, newest first, joined with the
// student's deck so each answer sits under its question. No grading.
export async function GET() {
  const out = [...submissions.values()]
    .sort((a, b) => b.submittedAt - a.submittedAt)
    .flatMap((sub) => {
      const member = getClassMember(sub.studentId);
      if (!member || !isConnected(member)) return [];
      const deck =
        decks.get(member.id) ?? fallbackDeck(member.id, member.profile);
      const qa = deck.cards.flatMap((card, i) => {
        const q = questionText(card);
        return q ? [{ question: q, answer: sub.answers[String(i)] ?? "" }] : [];
      });
      return [
        {
          studentId: member.id,
          name: member.name,
          profile: member.profile,
          submittedAt: sub.submittedAt,
          qa,
        },
      ];
    });

  return Response.json({ submissions: out });
}
