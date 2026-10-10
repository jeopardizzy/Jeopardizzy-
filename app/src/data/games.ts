/**
 * All playable games, listed on the home of Team Jeopardy.
 * A game = N rounds (boards) of 5 categories × 5 clues each.
 * Round values escalate: round 1 is 100–500, round 2 200–1000, and so on.
 * Book rounds reference the curated dataset by category name;
 * UoE rounds embed the idiom boards from the Use of English series.
 */
export interface GameDef {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  level: "Warm-up" | "Easy" | "Medium" | "Hard" | "Expert";
  /** rounds of curated-dataset category names */
  bookRounds: string[][];
  /** rounds from UoE idiom games (game ids), played after bookRounds */
  uoeRounds: string[];
  /** run the final wager round after the last board */
  final: boolean;
}

export const GAMES: GameDef[] = [
  {
    id: "first-words",
    name: "First Words",
    emoji: "🌱",
    blurb: "Friendly wordplay to open the evening.",
    level: "Warm-up",
    bookRounds: [
      ["Homonyms", "Compound Words", "Colorful Titles", "Hidden Body Parts", "Letter A Trivia"],
      ["Homonyms II", "Compound Words II", "Body-Part Titles", "Letter C Trivia", "Compound Words III"],
    ],
    uoeRounds: [],
    final: true,
  },
  {
    id: "around-the-world",
    name: "Around the World",
    emoji: "🌍",
    blurb: "Places, rivers, capitals and curious corners of the map.",
    level: "Easy",
    bookRounds: [
      ["Geographical Doubles", "Rivers", "World Spots", "Letter D Trivia", "Compound Words V"],
      ["I Initials", "Letter U Trivia", "Place-Name Titles", "Letter V Trivia", "Letter W Trivia"],
    ],
    uoeRounds: [],
    final: true,
  },
  {
    id: "names-and-faces",
    name: "Names & Faces",
    emoji: "🎭",
    blurb: "Famous people, beloved characters and what we call them.",
    level: "Medium",
    bookRounds: [
      ["Nicknames", "TV Characters", "Food & Drink", "Letter I Trivia", "Compound Words VI"],
      ["Names, Names", "Remarkable Women", "Film Biographies", "Military Ranks", "Letter N Trivia"],
    ],
    uoeRounds: [],
    final: true,
  },
  {
    id: "brain-stretchers",
    name: "Brain Stretchers",
    emoji: "🧠",
    blurb: "Backward words, split words and words that shift their sound.",
    level: "Hard",
    bookRounds: [
      ["Homonyms IV", "Compound Words IV", "Word Parts", "Heteronyms", "Backwords"],
      ["Homonyms III", "Word Parts II", "Heteronyms II", "Backwords II", "R Initials"],
    ],
    uoeRounds: [],
    final: true,
  },
  {
    id: "championship",
    name: "Championship",
    emoji: "🏆",
    blurb: "The toughest mix in the vault. Not for the faint of heart.",
    level: "Expert",
    bookRounds: [
      ["Colorful Titles II", "Homonyms V", "A Initials", "Color Associations", "TP Initials"],
      ["Body-Part Titles II", "Heteronyms III", "C & D Initials", "P & A Initials", "Letter X Trivia"],
    ],
    uoeRounds: [],
    final: true,
  },
  {
    id: "idiom-arena-1",
    name: "Idiom Arena I",
    emoji: "🎪",
    blurb: "Five boards of pure idiom gymnastics: sayings, homonyms, hidden animals and more.",
    level: "Medium",
    bookRounds: [],
    uoeRounds: ["uoe-h", "uoe-i", "uoe-j", "uoe-k", "uoe-n"],
    final: false,
  },
  {
    id: "idiom-arena-2",
    name: "Idiom Arena II",
    emoji: "🎡",
    blurb: "Six more boards: palindromes, portmanteaus, colour idioms and kangaroo words.",
    level: "Hard",
    bookRounds: [],
    uoeRounds: ["uoe-o", "uoe-p", "uoe-q", "uoe-r", "uoe-ac", "uoe-ad"],
    final: false,
  },
];
