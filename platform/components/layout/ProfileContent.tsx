import type { Profile } from "@/lib/types";

// DESIGN.md profile typography rules — student reading content only.
const profileClasses: Record<Profile, string> = {
  dyslexia:
    "font-sans text-left leading-loose max-w-[65ch] space-y-6 text-lg tracking-normal",
  adhd: "font-sans space-y-6 text-base leading-relaxed",
  blind: "font-sans space-y-4 text-lg leading-relaxed",
  deaf: "font-sans space-y-4 text-lg leading-relaxed",
};

export default function ProfileContent({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return <div className={profileClasses[profile]}>{children}</div>;
}
