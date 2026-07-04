import { notFound } from "next/navigation";
import { getStudent } from "@/lib/demo-data";
import { LiveLesson } from "@/components/lesson/LiveLesson";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = getStudent(studentId);
  if (!student) notFound();
  return <LiveLesson student={student} />;
}
