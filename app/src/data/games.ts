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
  /** rounds of standalone boards (UoE / classic sets), played after bookRounds */
  boardRounds: string[];
  /** grouping on the selection screen */
  series: "Book Club" | "Idiom Arenas" | "Classic Vault";
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
    boardRounds: [],
    final: true,
    series: "Book Club",
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
    boardRounds: [],
    final: true,
    series: "Book Club",
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
    boardRounds: [],
    final: true,
    series: "Book Club",
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
    boardRounds: [],
    final: true,
    series: "Book Club",
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
    boardRounds: [],
    final: true,
    series: "Book Club",
  },
  {
    id: "idiom-arena-1",
    name: "Idiom Arena I",
    emoji: "🎪",
    blurb: "Five boards of pure idiom gymnastics: sayings, homonyms, hidden animals and more.",
    level: "Medium",
    bookRounds: [],
    boardRounds: ["uoe-h", "uoe-i", "uoe-j", "uoe-k", "uoe-n"],
    final: false,
    series: "Idiom Arenas",
  },
  {
    id: "idiom-arena-2",
    name: "Idiom Arena II",
    emoji: "🎡",
    blurb: "Six more boards: palindromes, portmanteaus, colour idioms and kangaroo words.",
    level: "Hard",
    bookRounds: [],
    boardRounds: ["uoe-o", "uoe-p", "uoe-q", "uoe-r", "uoe-ac", "uoe-ad"],
    final: false,
    series: "Idiom Arenas",
  },
  {
    id: "idiom-arena-3",
    name: "Idiom Arena III",
    emoji: "🎠",
    blurb: "Pure idiom training: finish the saying, proverb completions, what-a-pair and more.",
    level: "Medium",
    bookRounds: [],
    boardRounds: ["arena3-r0", "arena3-r1", "arena3-r2", "arena3-r3", "arena3-r4"],
    final: false,
    series: "Idiom Arenas",
  },
  {
    id: "classic-wordplay",
    name: "Wordplay Classics",
    emoji: "🧩",
    blurb: "The original mix: endings, opposites, homonyms, stinky pinkies and more.",
    level: "Easy",
    bookRounds: [],
    boardRounds: ["legacy-s0-r0", "legacy-s0-r1", "legacy-s0-r2"],
    final: false,
    series: "Classic Vault",
  },
  {
    id: "classic-sayings",
    name: "Sayings & Proverbs",
    emoji: "💬",
    blurb: "Say what? Finish proverbs, decode directions, spot the odd one out.",
    level: "Easy",
    bookRounds: [],
    boardRounds: ["legacy-s1-r0", "legacy-s1-r1", "legacy-s1-r2", "legacy-s1-r3"],
    final: false,
    series: "Classic Vault",
  },
  {
    id: "classic-jingles",
    name: "Jingles & Catchphrases",
    emoji: "🎺",
    blurb: "Ad jingles, saintly surprises, flag words and acronym alphabet.",
    level: "Medium",
    bookRounds: [],
    boardRounds: ["legacy-s2-r0", "legacy-s2-r1", "legacy-s2-r2"],
    final: false,
    series: "Classic Vault",
  },
  {
    id: "classic-numbers",
    name: "Numbers & Places",
    emoji: "🗺️",
    blurb: "Mathematically speaking, scrambled states and terrible titles.",
    level: "Medium",
    bookRounds: [],
    boardRounds: ["legacy-s3-r0", "legacy-s3-r1", "legacy-s3-r2", "legacy-s3-r3"],
    final: false,
    series: "Classic Vault",
  },
  {
    id: "classic-saywhat",
    name: "Say What? Special",
    emoji: "💭",
    blurb: "Three flavors of Say What? plus biography guesses and colorfill.",
    level: "Hard",
    bookRounds: [],
    boardRounds: ["legacy-s4-r0", "legacy-s4-r1", "legacy-s4-r2", "legacy-s4-r3"],
    final: false,
    series: "Classic Vault",
  },
  {
    id: "classic-longplay",
    name: "The Long Play",
    emoji: "🎢",
    blurb: "Six boards in one sitting — federal holidays to palindromes.",
    level: "Hard",
    bookRounds: [],
    boardRounds: ["legacy-s5-r0", "legacy-s5-r1", "legacy-s5-r2", "legacy-s5-r3", "legacy-s5-r4", "legacy-s5-r5"],
    final: false,
    series: "Classic Vault",
  },
  {
    id: "grand-marathon",
    name: "Grand Marathon",
    emoji: "🏅",
    blurb: "Fourteen boards. Three hundred forty-five clues. The ultimate olympiad workout.",
    level: "Expert",
    bookRounds: [],
    boardRounds: ["legacy-s6-r0", "legacy-s6-r1", "legacy-s6-r2", "legacy-s6-r3", "legacy-s6-r4", "legacy-s6-r5", "legacy-s6-r6", "legacy-s6-r7", "legacy-s6-r8", "legacy-s6-r9", "legacy-s6-r10", "legacy-s6-r11", "legacy-s6-r12", "legacy-s6-r13"],
    final: false,
    series: "Classic Vault",
  },
];
