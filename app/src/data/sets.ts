/**
 * Selectable Jeopardy sets. Each set is two rounds of 5 categories —
 * round 1 at standard values, round 2 ("Double") at doubled values.
 * Category names must exist in the dataset (validated by tests).
 */
export interface SetDef {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  level: "Warm-up" | "Easy" | "Medium" | "Hard" | "Expert";
  round1: string[];
  round2: string[];
}

export const SETS: SetDef[] = [
  {
    id: "first-words",
    name: "First Words",
    emoji: "🌱",
    blurb: "Friendly wordplay to open the evening.",
    level: "Warm-up",
    round1: ["Homonyms", "Compound Words", "Colorful Titles", "Hidden Body Parts", "Letter A Trivia"],
    round2: ["Homonyms II", "Compound Words II", "Body-Part Titles", "Letter C Trivia", "Compound Words III"],
  },
  {
    id: "around-the-world",
    name: "Around the World",
    emoji: "🌍",
    blurb: "Places, rivers, capitals and curious corners of the map.",
    level: "Easy",
    round1: ["Geographical Doubles", "Rivers", "World Spots", "Letter D Trivia", "Compound Words V"],
    round2: ["I Initials", "Letter U Trivia", "Place-Name Titles", "Letter V Trivia", "Letter W Trivia"],
  },
  {
    id: "names-and-faces",
    name: "Names & Faces",
    emoji: "🎭",
    blurb: "Famous people, beloved characters and what we call them.",
    level: "Medium",
    round1: ["Nicknames", "TV Characters", "Food & Drink", "Letter I Trivia", "Compound Words VI"],
    round2: ["Names, Names", "Remarkable Women", "Film Biographies", "Military Ranks", "Letter N Trivia"],
  },
  {
    id: "brain-stretchers",
    name: "Brain Stretchers",
    emoji: "🧠",
    blurb: "Backward words, split words and words that shift their sound.",
    level: "Hard",
    round1: ["Homonyms IV", "Compound Words IV", "Word Parts", "Heteronyms", "Backwords"],
    round2: ["Homonyms III", "Word Parts II", "Heteronyms II", "Backwords II", "R Initials"],
  },
  {
    id: "championship",
    name: "Championship",
    emoji: "🏆",
    blurb: "The toughest mix in the vault. Not for the faint of heart.",
    level: "Expert",
    round1: ["Colorful Titles II", "Homonyms V", "A Initials", "Color Associations", "TP Initials"],
    round2: ["Body-Part Titles II", "Heteronyms III", "C & D Initials", "P & A Initials", "Letter X Trivia"],
  },
];
