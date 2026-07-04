import { ArrowUp, Eye, EyeOff, Hand, Pencil } from "lucide-react";
import type { Activity } from "@/lib/types";

export interface ActivityMeta {
  chip: string; // short label on the seat tile
  verb: string; // full phrase for the detail panel: "{name} {verb}"
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  // tone drives colour. "calm" = the reassuring default, deliberately quiet so
  // that the exceptions (amber status) are the only things that catch the eye.
  text: string;
  dot: string;
  pulse: boolean;
}

export const ACTIVITY_META: Record<Activity, ActivityMeta> = {
  following: {
    chip: "Following",
    verb: "is following your slides",
    icon: Eye,
    text: "text-stone-500",
    dot: "bg-stone-300",
    pulse: false,
  },
  ahead: {
    chip: "Scrolled ahead",
    verb: "scrolled ahead of the class",
    icon: ArrowUp,
    text: "text-amber-700",
    dot: "bg-amber-500",
    pulse: false,
  },
  hand: {
    chip: "Hand raised",
    verb: "raised their hand",
    icon: Hand,
    text: "text-amber-700",
    dot: "bg-amber-500",
    pulse: true,
  },
  homework: {
    chip: "On homework",
    verb: "is working on their homework",
    icon: Pencil,
    text: "text-teal-700",
    dot: "bg-teal-500",
    pulse: false,
  },
  away: {
    chip: "Off task",
    verb: "is off task",
    icon: EyeOff,
    text: "text-stone-400",
    dot: "bg-stone-300",
    pulse: false,
  },
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
