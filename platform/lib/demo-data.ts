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
  id: "newton-3",
  title: "Newton's Third Law",
  slides: [
    {
      index: 1,
      title: "Newton's Third Law",
      content_text:
        "For every action there is an equal and opposite reaction. When object A pushes on object B, object B pushes back on object A with the same force, in the opposite direction.",
      image_alt:
        "Two ice skaters pushing against each other's hands, gliding apart in opposite directions.",
    },
    {
      index: 2,
      title: "Force pairs",
      content_text:
        "Forces always come in pairs. The two forces in a pair are equal in size, opposite in direction, and act on DIFFERENT objects. That last part is the one everyone forgets.",
      image_alt:
        "Diagram of a book on a table: an arrow from the book pushing down on the table, and an arrow from the table pushing up on the book.",
    },
    {
      index: 3,
      title: "Swimming and rockets",
      content_text:
        "A swimmer pushes water backwards; the water pushes the swimmer forwards. A rocket pushes exhaust gas down; the gas pushes the rocket up. You don't need anything to push against except the thing you throw away.",
      image_alt:
        "A rocket launching, with exhaust gases drawn as arrows pointing down and a thrust arrow pointing up.",
    },
    {
      index: 4,
      title: "Why don't the forces cancel?",
      content_text:
        "The action and reaction forces act on different objects, so they never cancel each other out. The force on the swimmer affects the swimmer; the force on the water affects the water. Each object moves according to the forces on IT alone.",
    },
  ],
  transcript: "",
  summary: [],
};

// Stage-failure insurance: injected via the "Use backup transcript" button.
export const BACKUP_TRANSCRIPT = `Okay everyone, today we're looking at Newton's Third Law. For every action there is an equal and opposite reaction. Now what does that actually mean. If I push on the wall, the wall pushes back on me with exactly the same force. Not roughly the same, exactly the same. The key thing, and this is the bit that comes up in the homework, is that the two forces act on different objects. My push acts on the wall. The wall's push acts on me. That's why they don't cancel out. Think about a swimmer. She pushes the water backwards, and the water pushes her forwards, that's how she moves. Same with a rocket. The rocket throws gas out the back, and the gas pushes the rocket forward. It doesn't need air to push against, which is why rockets work in space. So when the homework asks you to identify a force pair, remember: same size, opposite direction, different objects.`;

export const BACKUP_SUMMARY = [
  "Newton's Third Law: every action has an equal and opposite reaction.",
  "The two forces in a pair are the same size, opposite direction — and act on different objects, so they never cancel.",
  "Swimmers push water backwards to move forwards; rockets push gas out to move — no air needed.",
];

// The one homework file used for every upload in the demo (no real parsing).
export const DEMO_HOMEWORK_TITLE = "Worksheet: Newton's Third Law";
export const DEMO_HOMEWORK_RAW = `Worksheet — Newton's Third Law

1. State Newton's Third Law in your own words.

2. A swimmer pushes water backwards with her hands and feet. Explain, using Newton's Third Law, why she moves forwards.

3. A book rests on a table. The book pushes down on the table with a force of 5 N. What is the Newton's Third Law reaction to this force?
   a) The weight of the book
   b) The table pushing up on the book with 5 N
   c) Gravity pulling the table down
   d) There is no reaction because nothing is moving

4. Rockets work in space even though there is no air to push against. Explain why.

5. If action and reaction forces are always equal and opposite, why don't they cancel out so that nothing can ever move?`;

// ---------------------------------------------------------------------------
// Fallback decks — used when Gemini is unavailable so a judge never sees an
// empty student view. Same shape as Gemini's structured output.
// ---------------------------------------------------------------------------

const CONCEPT_LAW: HomeworkCard = {
  type: "concept",
  heading: "The big idea",
  body: "For every action there is an equal and opposite reaction. When you push on something, it pushes back on you — same size, opposite direction.",
  slideRef: 1,
};

const CONCEPT_PAIRS: HomeworkCard = {
  type: "concept",
  heading: "Force pairs act on different objects",
  body: "The two forces in a pair never act on the same object. Your push acts on the wall; the wall's push acts on you. That is why they don't cancel.",
  slideRef: 2,
};

const CONCEPT_ROCKETS: HomeworkCard = {
  type: "concept",
  heading: "Swimmers and rockets",
  body: "A swimmer pushes water backwards, so the water pushes her forwards. A rocket throws gas out of the back, so the gas pushes the rocket forwards — no air needed.",
  slideRef: 3,
};

const MCQ_BOOK: HomeworkCard = {
  type: "mcq",
  question:
    "A book pushes down on a table with a force of 5 N. What is the Newton's Third Law reaction to this force?",
  options: [
    "The weight of the book",
    "The table pushing up on the book with 5 N",
    "Gravity pulling the table down",
    "There is no reaction because nothing is moving",
  ],
  correctIndex: 1,
  explanation:
    "The reaction to “book pushes table” is “table pushes book” — same size (5 N), opposite direction, acting on the other object.",
};

const FALLBACK_DECKS: Record<Profile, Deck["cards"]> = {
  dyslexia: [
    CONCEPT_LAW,
    {
      type: "short",
      question: "State Newton's Third Law in your own words.",
      modelPoints: [
        "Every action has a reaction",
        "Equal in size",
        "Opposite in direction",
      ],
    },
    CONCEPT_ROCKETS,
    {
      type: "short",
      question:
        "A swimmer pushes water backwards.\n\nExplain why she moves forwards.",
      modelPoints: [
        "She pushes the water backwards",
        "The water pushes her forwards with equal force",
        "The forward force acts on her, so she moves",
      ],
    },
    CONCEPT_PAIRS,
    MCQ_BOOK,
    {
      type: "short",
      question:
        "Rockets work in space with no air.\n\nExplain why, using Newton's Third Law.",
      modelPoints: [
        "The rocket pushes gas out of the back",
        "The gas pushes the rocket forwards",
        "It pushes against the gas, not the air",
      ],
    },
    {
      type: "short",
      question:
        "Action and reaction are equal and opposite.\n\nWhy don't they cancel out?",
      modelPoints: [
        "They act on different objects",
        "Each object only feels the force on itself",
      ],
    },
  ],
  adhd: [
    CONCEPT_LAW,
    {
      type: "steps",
      question: "Question 1: State Newton's Third Law in your own words.",
      steps: [
        "Say the law out loud once: every action has an equal and opposite reaction.",
        "Write one sentence starting with “When something pushes…”",
        "Check your sentence mentions: equal size, opposite direction.",
      ],
    },
    CONCEPT_ROCKETS,
    {
      type: "steps",
      question:
        "Question 2: Explain why a swimmer who pushes water backwards moves forwards.",
      steps: [
        "Name the action: the swimmer pushes the water backwards.",
        "Name the reaction: the water pushes the swimmer forwards.",
        "Write both sentences down — that's the whole answer.",
      ],
    },
    MCQ_BOOK,
    {
      type: "steps",
      question: "Question 4: Why do rockets work in space with no air?",
      steps: [
        "What does the rocket throw out of the back? Write it down (gas).",
        "What does that gas do back to the rocket? (pushes it forwards)",
        "Finish with: “so it doesn't need air to push against.”",
      ],
    },
    CONCEPT_PAIRS,
    {
      type: "steps",
      question:
        "Question 5: Why don't action and reaction forces cancel out?",
      steps: [
        "Remember: the two forces act on DIFFERENT objects.",
        "Write which object each force acts on for the swimmer example.",
        "Explain: each object only moves because of the force on itself.",
      ],
    },
  ],
  blind: [
    CONCEPT_LAW,
    CONCEPT_PAIRS,
    {
      type: "short",
      question: "State Newton's Third Law in your own words.",
      modelPoints: [
        "Every action has a reaction",
        "Equal in size, opposite in direction",
      ],
    },
    {
      type: "short",
      question:
        "A swimmer pushes water backwards with her hands and feet. Explain, using Newton's Third Law, why she moves forwards.",
      modelPoints: [
        "Action: swimmer pushes water backwards",
        "Reaction: water pushes swimmer forwards with equal force",
      ],
    },
    MCQ_BOOK,
    CONCEPT_ROCKETS,
    {
      type: "short",
      question:
        "Rockets work in space even though there is no air to push against. Explain why.",
      modelPoints: [
        "Rocket pushes exhaust gas backwards",
        "Gas pushes rocket forwards — the gas is what it pushes against",
      ],
    },
    {
      type: "short",
      question:
        "If action and reaction forces are always equal and opposite, why don't they cancel out?",
      modelPoints: [
        "They act on different objects",
        "Forces only cancel when they act on the same object",
      ],
    },
  ],
  deaf: [
    {
      type: "concept",
      heading: "From today's lesson",
      body: "Newton's Third Law: every action has an equal and opposite reaction. The two forces are the same size, opposite in direction, and act on different objects — so they never cancel.",
      slideRef: 1,
    },
    CONCEPT_ROCKETS,
    {
      type: "short",
      question: "State Newton's Third Law in your own words.",
      modelPoints: [
        "Every action has a reaction",
        "Equal in size, opposite in direction",
      ],
    },
    {
      type: "short",
      question:
        "A swimmer pushes water backwards. Explain why she moves forwards.",
      modelPoints: [
        "Action: swimmer pushes water backwards",
        "Reaction: water pushes swimmer forwards",
      ],
    },
    CONCEPT_PAIRS,
    MCQ_BOOK,
    {
      type: "short",
      question: "Rockets work in space with no air. Explain why.",
      modelPoints: [
        "Rocket pushes gas out of the back",
        "Gas pushes the rocket forwards",
      ],
    },
    {
      type: "short",
      question: "Why don't action and reaction forces cancel out?",
      modelPoints: ["They act on different objects"],
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
