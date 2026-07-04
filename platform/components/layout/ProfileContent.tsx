import type { Profile } from "@/lib/types";
import { PROFILE_THEMES } from "@/components/homework/profileTheme";

/**
 * Wraps student reading content in the profile's typography rules
 * (spacing, measure, size) and font (Lexend for dyslexia).
 */
export default function ProfileContent({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const theme = PROFILE_THEMES[profile];
  return (
    <div className={`${theme.content} ${theme.fontClassName ?? "font-sans"}`}>
      {children}
    </div>
  );
}
