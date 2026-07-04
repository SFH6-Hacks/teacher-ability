import type {
  Activity,
  ClassMember,
  Deck,
  HomeworkCard,
  Lesson,
  Profile,
  Student,
} from "./types";

export const ROSTER: Student[] = [
  {
    id: "aisha",
    name: "Aisha",
    profile: "dyslexia",
    profileLabel: "Dyslexia",
    needs: "Short chunks, left-aligned calm typography, no text walls",
    age: 12,
    grade: "Year 8",
    avatar: { emoji: "🦊", color: "#F59E0B" },
    interests: ["football", "drawing comics", "space documentaries"],
    strengths: ["verbal reasoning", "big-picture thinking", "explaining ideas out loud"],
    accommodations: [
      "Lexend dyslexia-friendly font",
      "Cream (off-white) background to reduce glare",
      "Extra line, letter and word spacing",
      "Lines capped at ~60 characters, left-aligned",
      "No italics or ALL CAPS",
      "Text-to-speech on every card",
      "Optional coloured tint overlay",
    ],
    readingLevel: "About 2 years below age level; strong listening comprehension",
    preferredInput: ["mouse", "voice"],
    preferredOutput: ["audio", "text"],
    notes:
      "Decoding text is slow but understanding is excellent once text is heard. Confidence dips fast when facing a wall of text — chunk everything.",
  },
  {
    id: "leo",
    name: "Leo",
    profile: "adhd",
    profileLabel: "ADHD",
    needs: "One clear next step at a time, small wins, visible progress",
    age: 13,
    grade: "Year 8",
    avatar: { emoji: "🚀", color: "#EF4444" },
    interests: ["skateboarding", "video games", "building model rockets"],
    strengths: ["creative problem solving", "hyperfocus on hands-on tasks", "quick pattern spotting"],
    accommodations: [
      "Focus mode — one task on screen at a time",
      "Questions broken into small checkable steps",
      "Visible progress bar and streak counter",
      "Celebration on every small win",
      "Brain-break prompts every few cards",
      "Minimal on-screen clutter and decoration",
    ],
    readingLevel: "At age level; loses the thread in long unbroken passages",
    preferredInput: ["mouse", "keyboard"],
    preferredOutput: ["visual", "text"],
    notes:
      "Starts strong, drifts after ~10 minutes. Immediate feedback and visible wins keep him going; open-ended tasks with no next step are where he stalls.",
  },
  {
    id: "sam",
    name: "Sam",
    profile: "blind",
    profileLabel: "Blind / low-vision",
    needs: "Linear speakable structure, described images, text-to-speech",
    age: 12,
    grade: "Year 8",
    avatar: { emoji: "🎧", color: "#8B5CF6" },
    interests: ["piano", "audiobooks", "cricket commentary"],
    strengths: ["exceptional listening memory", "mental arithmetic", "sequential reasoning"],
    accommodations: [
      "Audio-first: every card read aloud automatically",
      "Full keyboard navigation (arrows, letter keys for answers)",
      "All actions announced via screen-reader live regions",
      "High-contrast large text for residual vision",
      "Images always described in words",
      "Nothing conveyed by visuals alone",
    ],
    readingLevel: "Fluent with audio and braille; uses a screen reader daily",
    preferredInput: ["keyboard", "voice"],
    preferredOutput: ["audio"],
    notes:
      "Confident screen-reader user. Anything mouse-only or purely visual excludes him entirely — every interaction needs a keyboard path and spoken feedback.",
  },
  {
    id: "tom",
    name: "Tom",
    profile: "deaf",
    profileLabel: "Deaf / hard of hearing",
    needs: "Text-first — lesson recap in writing, nothing audio-only",
    age: 13,
    grade: "Year 8",
    avatar: { emoji: "🎨", color: "#14B8A6" },
    interests: ["animation", "BSL poetry club", "mountain biking"],
    strengths: ["strong visual memory", "diagram interpretation", "spotting visual detail"],
    accommodations: [
      "Captions / written transcript for anything spoken",
      "Diagrams and icons alongside every explanation",
      "Visual feedback (flashes, badges) for every event — no audio cues",
      "Written recap panel of what's been covered",
      "Speaker labels on any dialogue",
    ],
    readingLevel: "At age level; BSL is his first language, English his second",
    preferredInput: ["mouse", "touch"],
    preferredOutput: ["visual", "text"],
    notes:
      "Misses anything delivered only by voice. Give him the same information visually and he's one of the strongest in the class — lean on diagrams.",
  },
];

// ---------------------------------------------------------------------------
// The full class. ROSTER above stays the 4 "featured" students that have real
// /hw views wired up. CLASS is everyone in the room, shown on the seating plan
// — but only students with an accessibility need get a Recast laptop, so only
// they carry a `profile` (connected); the rest are regular students, present
// but not on the app. Seats are laid out row-major.
// ---------------------------------------------------------------------------

export const SEAT_COLS = 6;

export const PROFILE_NEEDS: Record<Profile, string> = {
  dyslexia: "Short chunks, calm left-aligned typography, no text walls",
  adhd: "One clear next step at a time, small wins, visible progress",
  blind: "Linear speakable structure, described images, text-to-speech",
  deaf: "Text-first — lesson recap in writing, nothing audio-only",
};

// [name, profile?, id?, featured?] — a profile means connected to Recast; no
// profile means a regular student. id defaults to the lowercased first name.
const CLASS_SEED: [string, Profile?, string?, boolean?][] = [
  ["Aisha", "dyslexia", "aisha", true],
  ["Marcus"],
  ["Priya", "blind"],
  ["Tom", "deaf", "tom", true],
  ["Chloe"],
  ["Ethan"],
  ["Leo", "adhd", "leo", true],
  ["Hannah"],
  ["Sam", "blind", "sam", true],
  ["Noah", "dyslexia"],
  ["Zara"],
  ["Oliver"],
  ["Mia"],
  ["Jacob"],
  ["Amara", "deaf"],
  ["Finn"],
  ["Grace"],
  ["Ravi"],
  ["Isla"],
  ["Dylan"],
  ["Sophia"],
  ["Kai"],
  ["Lena", "adhd"],
  ["Ben"],
];

export const CLASS: ClassMember[] = CLASS_SEED.map(
  ([name, profile, id, featured]) => ({
    id: id ?? name.toLowerCase(),
    name,
    profile,
    featured,
  }),
);

// Live activity at the moment the demo opens: a lesson already in progress —
// most connected students are following, one has drifted ahead, one is off-task.
export const INITIAL_ACTIVITY: Record<string, Activity> = {
  amara: "ahead",
  lena: "away",
};

// Scripted timeline the seating plan loops through, so the room feels alive on
// stage without any real telemetry. Times are seconds from the start of a loop;
// each patch is applied on top of the running state, then it wraps. Only ever
// references connected students — regular students have no app activity.
export interface ActivityBeat {
  at: number;
  patch: Record<string, Activity>;
}

export const ACTIVITY_SCRIPT: ActivityBeat[] = [
  { at: 6, patch: { sam: "ahead" } },
  { at: 11, patch: { leo: "hand" } },
  { at: 16, patch: { amara: "following", noah: "away" } },
  { at: 22, patch: { sam: "following", priya: "hand" } },
  { at: 28, patch: { leo: "homework", aisha: "ahead" } },
  { at: 34, patch: { noah: "following", lena: "following", priya: "following" } },
  { at: 40, patch: { aisha: "following", leo: "following" } },
];

export const ACTIVITY_LOOP_SECONDS = 46;

export const DEMO_LESSON: Lesson = {
  id: "area-perimeter",
  title: "Area & Perimeter of 2D Shapes",
  slides: [
    {
      index: 1,
      title: "Area & Perimeter",
      content_text:
        "Perimeter is the total distance around the outside of a shape — like walking along its edges. Area is the amount of space inside the shape — like how much paint you'd need to cover it. They are measured in different units: perimeter in units of length (cm, m), area in square units (cm², m²).",
      image_alt:
        "A rectangle drawn on a grid, with the outer edge highlighted in blue and the interior filled in orange. Labels show perimeter = distance around, area = space inside.",
    },
    {
      index: 2,
      title: "Rectangles & Squares",
      content_text:
        "For a rectangle: Area = length × width (A = l × w). Perimeter = 2 × (length + width). A square is just a rectangle with all sides equal, so Area = side × side = s², and Perimeter = 4s. Always include the correct units — cm for perimeter, cm² for area.",
      image_alt:
        "Diagram of a rectangle labelled length 6 cm and width 4 cm. Area formula shown as l × w = 24 cm². Perimeter shown as 2(l + w) = 20 cm.",
    },
    {
      index: 3,
      title: "Triangles & Parallelograms",
      content_text:
        "Area of a triangle = ½ × base × height (A = ½bh). The height must be the perpendicular height — the vertical distance from the base to the opposite vertex, not the sloping side. For a parallelogram: Area = base × height (same idea, no halving).",
      image_alt:
        "Triangle with base labelled 8 cm and a dotted perpendicular line from the top vertex to the base labelled height 5 cm. Formula A = ½ × 8 × 5 = 20 cm² shown below.",
    },
    {
      index: 4,
      title: "Circles",
      content_text:
        "For a circle, we use π (pi ≈ 3.14). Area = π × r² where r is the radius. Circumference (the circle's perimeter) = 2 × π × r. The radius goes from the centre to the edge; the diameter is twice the radius and goes all the way across.",
      image_alt:
        "Circle with centre marked, radius drawn from centre to edge labelled 'r', and a diameter line across the whole circle labelled 'd = 2r'. Area formula πr² and circumference formula 2πr shown.",
    },
  ],
  transcript: "",
  summary: [],
};

// Stage-failure insurance: injected via the "Use backup transcript" button.
export const BACKUP_TRANSCRIPT = `Okay everyone, today we're looking at area and perimeter of 2D shapes. First off, what's the difference between area and perimeter? Perimeter is the distance all the way around the outside of a shape. If you walk along the edge of a field, that's the perimeter. Area is the amount of space inside the shape. If you want to paint the floor of a room, that's the area. Perimeter is just a length, so we measure it in centimetres or metres. Area is different — it's two-dimensional, so we measure it in square centimetres or square metres. For a rectangle, area is length times width, and perimeter is two times length plus width. For a triangle, it's half times base times height. And the height must be the perpendicular height — straight up from the base, not the sloping side. And for circles, we use pi. Area is pi times r squared — that's the radius squared, not doubled. Circumference, which is the circle's perimeter, is two times pi times r. The big thing to watch out for in the homework is using the right units — cm for perimeter, cm squared for area. Don't mix them up.`;

export const BACKUP_SUMMARY = [
  "Perimeter = distance around the outside; Area = space inside. Different units (cm vs cm²).",
  "Rectangle: Area = l × w, Perimeter = 2(l + w). Triangle: Area = ½ × base × height (perpendicular height).",
  "Circle: Area = π × r², Circumference = 2 × π × r. Use π ≈ 3.14.",
];

// The one homework file used for every upload in the demo (no real parsing).
export const DEMO_HOMEWORK_TITLE = "Worksheet: Area & Perimeter";
export const DEMO_HOMEWORK_RAW = `Worksheet — Area & Perimeter of 2D Shapes

1. What is the difference between area and perimeter? Explain in your own words.

2. A rectangle is 6 cm long and 4 cm wide. Find its area and perimeter. Include the correct units.

3. A triangle has a base of 10 cm and a height of 6 cm. What is its area?
   a) 60 cm²
   b) 30 cm²
   c) 16 cm²
   d) 30 cm

4. A circle has a radius of 7 cm. Using π = 3.14, work out the area of the circle. Round your answer to the nearest whole number.

5. Is it possible for two different shapes to have the same perimeter but different areas? Give an example to support your answer.`;

// ---------------------------------------------------------------------------
// Fallback decks — used when Gemini is unavailable so a judge never sees an
// empty student view. Same shape as Gemini's structured output.
// ---------------------------------------------------------------------------

const CONCEPT_LAW: HomeworkCard = {
  type: "concept",
  heading: "Area vs Perimeter",
  body: "Perimeter is the total distance around a shape. Area is the space inside it. Perimeter is measured in units of length (cm, m). Area is measured in square units (cm\u00B2, m\u00B2).",
  slideRef: 1,
};

const CONCEPT_PAIRS: HomeworkCard = {
  type: "concept",
  heading: "Rectangles & Squares",
  body: "For any rectangle: Area = length \u00D7 width. Perimeter = 2 \u00D7 (length + width). For a square (all sides equal): Area = side\u00B2. Perimeter = 4 \u00D7 side. Always include the correct unit.",
  slideRef: 2,
};

const CONCEPT_ROCKETS: HomeworkCard = {
  type: "concept",
  heading: "Triangles & Parallelograms",
  body: "Area of a triangle = \u00BD \u00D7 base \u00D7 perpendicular height. The height is the vertical distance from the base to the opposite vertex \u2014 not the sloping side. For a parallelogram: Area = base \u00D7 height (no halving).",
  slideRef: 3,
};

const MCQ_BOOK: HomeworkCard = {
  type: "mcq",
  question:
    "A triangle has a base of 10 cm and a height of 6 cm. What is its area?",
  options: [
    "60 cm\u00B2",
    "30 cm\u00B2",
    "16 cm\u00B2",
    "30 cm",
  ],
  correctIndex: 1,
  explanation:
    "Area of a triangle = \u00BD \u00D7 base \u00D7 height = \u00BD \u00D7 10 \u00D7 6 = 30 cm\u00B2. The answer must be in square units (cm\u00B2), not linear units (cm).",
};

const FALLBACK_DECKS: Record<Profile, Deck["cards"]> = {
  dyslexia: [
    CONCEPT_LAW,
    {
      type: "short",
      question: "What is the difference between area and perimeter?",
      modelPoints: [
        "Perimeter is the distance around the outside",
        "Area is the space inside the shape",
        "Perimeter in units (cm), area in square units (cm\u00B2)",
      ],
    },
    CONCEPT_PAIRS,
    MCQ_BOOK,
    CONCEPT_ROCKETS,
    {
      type: "short",
      question:
        "A rectangle is 6 cm long and 4 cm wide.\n\nFind its area and perimeter. Include the correct units.",
      modelPoints: [
        "Area = length \u00D7 width = 6 \u00D7 4 = 24 cm\u00B2",
        "Perimeter = 2 \u00D7 (length + width) = 2 \u00D7 (6 + 4) = 20 cm",
        "Area is squared units, perimeter is linear units",
      ],
    },
    {
      type: "short",
      question:
        "A circle has a radius of 7 cm. Using \u03C0 = 3.14, work out its area. Round to the nearest whole number.",
      modelPoints: [
        "Area = \u03C0 \u00D7 r\u00B2 = 3.14 \u00D7 7\u00B2",
        "= 3.14 \u00D7 49 = 153.86 cm\u00B2",
        "Rounded to 154 cm\u00B2",
      ],
    },
    {
      type: "short",
      question:
        "Can two different shapes have the same perimeter but different areas?\n\nExplain with an example.",
      modelPoints: [
        "Yes, this is possible",
        "Example: a 3\u00D75 rectangle has area 15 and perimeter 16",
        "A 2\u00D76 rectangle has area 12 and the same perimeter 16",
        "Shapes with the same perimeter can have different areas",
      ],
    },
  ],
  adhd: [
    CONCEPT_LAW,
    {
      type: "steps",
      question: "Question 1: Explain the difference between area and perimeter.",
      steps: [
        "Start with perimeter: it's the distance around the outside.",
        "Now area: it's the space inside the shape.",
        "Write: \"Perimeter is \u2026 and area is \u2026\" in one sentence.",
      ],
    },
    CONCEPT_PAIRS,
    {
      type: "steps",
      question: "Question 2: A rectangle is 6 cm by 4 cm. Find its area and perimeter.",
      steps: [
        "Area first: multiply length by width. Write that down.",
        "Now perimeter: add length and width, then multiply by 2.",
        "Check your units \u2014 area needs cm\u00B2, perimeter needs cm.",
      ],
    },
    MCQ_BOOK,
    {
      type: "steps",
      question: "Question 4: A circle has radius 7 cm. Find its area.",
      steps: [
        "Write down the formula: Area = \u03C0 \u00D7 r\u00B2.",
        "Square the radius: 7\u00B2 = 49.",
        "Multiply by \u03C0: 3.14 \u00D7 49 = ?",
        "Round your answer to the nearest whole number.",
      ],
    },
    CONCEPT_ROCKETS,
    {
      type: "steps",
      question: "Question 5: Explain how two shapes can have the same perimeter but different areas.",
      steps: [
        "Think of a long thin rectangle vs a squarer one.",
        "Sketch a 3\u00D75 rectangle and a 2\u00D76 rectangle \u2014 both have perimeter 16.",
        "Calculate each area. Which one is bigger?",
        "Write: \"Same perimeter doesn't mean same area because \u2026\"",
      ],
    },
  ],
  blind: [
    CONCEPT_LAW,
    CONCEPT_PAIRS,
    {
      type: "short",
      question: "What is the difference between area and perimeter?",
      modelPoints: [
        "Perimeter is the distance around the outside",
        "Area is the space inside the shape",
        "Perimeter in cm, area in cm\u00B2",
      ],
    },
    {
      type: "short",
      question:
        "A rectangle is 6 cm long and 4 cm wide.\n\nFind its area and perimeter with the correct units.",
      modelPoints: [
        "Area = length \u00D7 width = 6 \u00D7 4 = 24 cm\u00B2",
        "Perimeter = 2 \u00D7 (6 + 4) = 20 cm",
        "Different units for each measurement",
      ],
    },
    MCQ_BOOK,
    CONCEPT_ROCKETS,
    {
      type: "short",
      question:
        "A circle has a radius of 7 cm. Using \u03C0 = 3.14, work out its area. Round to the nearest whole number.",
      modelPoints: [
        "Area = \u03C0 \u00D7 r\u00B2 = 3.14 \u00D7 49",
        "= 153.86 cm\u00B2",
        "Rounded to 154 cm\u00B2",
      ],
    },
    {
      type: "short",
      question:
        "Can two different shapes have the same perimeter but different areas? Explain with an example.",
      modelPoints: [
        "Yes, possible",
        "3\u00D75 rectangle: perimeter 16, area 15",
        "2\u00D76 rectangle: same perimeter 16, area 12",
        "Shape matters, not just perimeter",
      ],
    },
  ],
  deaf: [
    {
      type: "concept",
      heading: "From today's lesson",
      body: "Perimeter is the distance around a shape (cm, m). Area is the space inside it (cm\u00B2, m\u00B2). Rectangle: Area = l \u00D7 w, Perimeter = 2(l + w). Triangle: Area = \u00BD \u00D7 base \u00D7 height. Circle: Area = \u03C0r\u00B2, Circumference = 2\u03C0r.",
      slideRef: 1,
    },
    CONCEPT_LAW,
    {
      type: "short",
      question: "What is the difference between area and perimeter?",
      modelPoints: [
        "Perimeter is distance around",
        "Area is space inside",
        "Different units for each",
      ],
    },
    {
      type: "short",
      question:
        "A rectangle is 6 cm long and 4 cm wide.\n\nFind its area and perimeter.",
      modelPoints: [
        "Area = 6 \u00D7 4 = 24 cm\u00B2",
        "Perimeter = 2(6 + 4) = 20 cm",
      ],
    },
    MCQ_BOOK,
    CONCEPT_PAIRS,
    CONCEPT_ROCKETS,
    {
      type: "short",
      question: "A circle has radius 7 cm. Work out its area using \u03C0 = 3.14.",
      modelPoints: [
        "Area = 3.14 \u00D7 49 = 153.86",
        "Round to 154 cm\u00B2",
      ],
    },
    {
      type: "short",
      question: "Can two shapes with the same perimeter have different areas? Give an example.",
      modelPoints: ["Yes \u2014 e.g. 3\u00D75 vs 2\u00D76 rectangle both have perimeter 16 but areas 15 and 12"],
    },
  ],
};

export function fallbackDeck(studentId: string, profile: Profile): Deck {
  return {
    studentId,
    title: DEMO_HOMEWORK_TITLE,
    cards: [...FALLBACK_DECKS[profile]],
    generatedBy: "fallback",
  };
}

export function getStudent(id: string): Student | undefined {
  return ROSTER.find((s) => s.id === id);
}

export function getClassMember(id: string): ClassMember | undefined {
  return CLASS.find((s) => s.id === id);
}

// The prompt text a student answers, or null for recap-only "concept" cards.
export function questionText(card: HomeworkCard): string | null {
  switch (card.type) {
    case "mcq":
    case "short":
    case "steps":
      return card.question;
    default:
      return null;
  }
}
