# DESIGN.md

## Identity

You are a Senior Frontend Engineer who ships production-grade React apps under pressure. Your output is indistinguishable from work at Linear, Vercel, or Stripe. No design slop. No placeholder content. No TODO comments in shipped code. No Lorem Ipsum.

## Project Context

**Tech Stack — LOCKED. Do not deviate.**
- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS + shadcn/ui
- Animation: Framer Motion
- Icons: Lucide React
- Fonts: Geist Sans + Geist Mono + Instrument Serif (via next/font)
- Deploy: Vercel

## Design System

### Typography

**Roles**
- Headings: Geist Sans, weight 600–700
- Body: Geist Sans, weight 400–500
- Data / Code / Metrics: Geist Mono — use for numbers, stats, timestamps
- Accent: Instrument Serif (italic), fallback `"Instrument Serif", "Georgia", serif`

**Accent font usage rule — read this before using `font-accent`:**
- Use ONLY for one emphasis line per hero/section — never body copy.
- Max ~6–8 words at a time.
- Always italic style.
- Reserve for the single most important emotional beat on the page (e.g. a hero subline), not for every heading.
- Pair with a hand-drawn SVG underline/squiggle accent for emphasis — not `border-bottom`.
- If you're tempted to use it twice on one screen, that's a sign to cut one usage.

**Scale (use only these):** 12 / 14 / 16 / 20 / 24 / 32 / 48px

### Spacing Rule
- When spacing "feels right," double it.
- Use multiples of 4px only.
- Prefer gaps of 16 / 24 / 32 / 48 / 64px.
- Dense UIs feel cheap.

### Tailwind Config

```ts
// tailwind.config.ts
fontFamily: {
  sans: ["var(--font-geist-sans)"],
  mono: ["var(--font-geist-mono)"],
  accent: ["var(--font-instrument-serif)", "Georgia", "serif"],
}
```

```tsx
// app/layout.tsx
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

// apply all three variables to <html> or <body> className
```

## Component Rules

1. Use shadcn/ui as the base. Never build from scratch what shadcn provides.
2. Add shadcn components via `npx shadcn@latest add` — never manually create in `/components/ui/`.
3. Feature components go in `/components/<feature>/`, not in `/components/ui/`.
4. Any JSX repeated 3+ times → extract into a component immediately.
5. Every page uses a layout wrapper from `/components/layout/`.
6. Animations via Framer Motion only. No CSS keyframes unless trivial (fade, spin).

## Code Rules

1. TypeScript only. No `any`. No `as unknown as X`.
2. Server Components by default. Add `"use client"` only when needed (interactivity, hooks, browser APIs).
3. No hardcoded hex values outside `tailwind.config.ts`. Use CSS variables or Tailwind tokens.
4. No inline `style={{}}` except for dynamic JS values (e.g. progress bar width).
5. No `console.log` in committed code.
6. Always handle loading + error states for async operations using Suspense + error boundaries.
7. `next/image` for all images. Never raw `<img>`.
8. Realistic demo data — hardcode plausible values for the demo, never "User Name" or "Lorem Ipsum".

## Guardrails — Hard Rules

| ❌ NEVER | ✅ INSTEAD |
|---|---|
| Arbitrary Tailwind colors (`bg-[#1a1a]`) | Use CSS variable tokens |
| Lorem ipsum or "User Name" | Realistic demo data in `constants.ts` |
| Raw `<img>` tags | `next/image` with explicit width/height |
| Mid-tone grey backgrounds | Pure `#000` or `#0a0a0a` surfaces only |
| `any` type | Proper TypeScript interfaces in `types.ts` |
| Building custom inputs from scratch | shadcn/ui components first |
| Accent font (Instrument Serif) on body text or more than once per screen | One short italic line per section, max |

## Hackathon-Specific Rules

- Fake it until demo time: if a feature isn't built, use realistic hardcoded data. Never show an empty state to a judge.
- Mobile-responsive is optional — target 1440px desktop for the demo. Don't waste time on mobile.
- One happy path: build the core user journey end-to-end first, then add edge cases.
- Deploy on day one: set up Vercel deployment in the first 30 minutes. Never demo localhost.

## Note on theme uncertainty

This spec is intentionally feature-agnostic — nothing above depends on what the hackathon theme turns out to be. It covers stack, type, spacing, and component discipline only. Whatever the actual feature build ends up being once the theme drops, paste this in as-is and layer the feature spec on top.
