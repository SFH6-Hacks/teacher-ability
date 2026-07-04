import { notFound } from "next/navigation";
import { getStudent, fallbackDeck } from "@/lib/demo-data";
import { decks } from "@/lib/store";
import HomeworkExperience from "@/components/homework/HomeworkExperience";

export const dynamic = "force-dynamic";

export default async function HomeworkPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = getStudent(studentId);
  if (!student) notFound();
  const deck =
    decks.get(studentId) ?? fallbackDeck(student.id, student.profile);
  return <HomeworkExperience student={student} deck={deck} />;
}
