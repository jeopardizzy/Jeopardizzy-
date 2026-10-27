/**
 * Every category belongs to a task: numbered and lettered sets of the same
 * puzzle ("Bonus Mix 1" … "Bonus Mix 14", "Homonyms A II") are one task, and
 * every task has a guide. Used by the board builder (one entry per task) and
 * the "How to play" button on clue cards.
 */
import { GUIDES, type GuideEntry } from "./guides";

/** Different names for the same puzzle. */
const SAME_TASK: Record<string, string> = {
  "Geographical Double Meanings": "Geographical Double Entendres",
  "Geographical Doubles": "Geographical Double Entendres",
  Semordnilaps: "Backwords",
  "Hidden Body Parts": "Hidden Anatomy",
  "Replace the Elbow": "Body-Part Titles",
  "Chartreuse Titles": "Colorful Titles",
  "What's the Missing Number?": "Missing Numbers",
  "Double Trouble": "Compound Words",
  "Rhyming Words & Phrases": "Rhyming Words",
  "It's a K-ick": "It's a Kick",
  "It's CH-arming": "It's Charming",
  "What a Pair!": "What a Pair",
  "Red, White or Blue": "Red, White, or Blue",
  "X, Y or Z": "X, Y, or Z",
  "Endings and Beginnings": "Endings & Beginnings",
};

/**
 * The task a category belongs to: "Bonus Mix 7" → "Bonus Mix",
 * "Homonyms A II" → "Homonyms", "Brrrr! (BR-)" → "Brrrr!".
 */
export function taskName(category: string): string {
  const name = category
    .replace(/’/g, "'")
    .replace(/\s*\([^)]*\)$/, "")
    .replace(/\s+(?:\d+|[IVX]+)$/, "")
    .replace(/\s+[AB]$/, "")
    .trim();
  return SAME_TASK[name] ?? name;
}

/** Guide id for each task; anything not listed is plain trivia. */
const TASK_GUIDE: Record<string, string> = {
  "Acronym Alphabet": "acronyms",
  "Odds & Ends": "bonus-mix",
  "Bonus Mix": "bonus-mix",
  "Add It Up": "add-it-up",
  "Alma's Shopping List": "change-letter",
  "Change a Letter": "change-letter",
  Anagrams: "anagrams",
  "Opposites Attract": "anagrams",
  "Scrambled Abbreviations": "anagrams",
  "Scrambled States": "anagrams",
  Backwords: "backwords",
  Palindromes: "palindromes",
  "Body-Part Titles": "body-titles",
  "Colorful Titles": "title-swap",
  "Replace the Swamp": "title-swap",
  "Place-Name Titles": "fix-title",
  "Replace the Animal": "fix-title",
  "Say What?": "paraphrase",
  "Ted's Terrible Titles": "paraphrase",
  "Compound Words": "compound",
  "Compound Word Finder": "compound",
  "Endings & Beginnings": "bridge-word",
  "Up and Down": "up-down",
  "Farmyard Compounds": "compound-clues",
  "Harvest Compounds": "compound-clues",
  "Icy Compounds": "compound-clues",
  "Snowy Compounds": "compound-clues",
  "Word Parts": "word-parts",
  Portmanteaus: "word-parts",
  "Number Words": "number-words",
  Heteronyms: "heteronyms",
  Homonyms: "homonyms",
  Homophones: "homonyms",
  "Frosty Homophones": "homonyms",
  "Harvest Homophones": "homonyms",
  "Hidden Anatomy": "hidden-word",
  "Hidden Animals": "hidden-word",
  "Kangaroo Words": "kangaroo",
  "Geographical Double Entendres": "geo-doubles",
  Nicknames: "nicknames",
  "Geographical Nicknames": "nicknames",
  "Presidential Nicknames": "nicknames",
  "It Starts with a Letter": "letter-start",
  "Just One Letter": "letter-start",
  "Letter Speller": "letter-speller",
  "A Initials": "initials-pair",
  "C & D Initials": "initials-pair",
  "I Initials": "initials-pair",
  "P & A Initials": "initials-pair",
  "R Initials": "initials-pair",
  "TP Initials": "initials-pair",
  "Big Bang": "initials-pair",
  "Golly Gee": "initials-pair",
  "Daily Double": "initials-pair",
  "M & M's": "initials-pair",
  "Echo Echo": "initials-pair",
  BigBoy: "theme-words",
  "Brrrr!": "theme-words",
  "It's a Kick": "theme-words",
  "It's Charming": "theme-words",
  "It's Playtime": "theme-words",
  "Just J's": "theme-words",
  "Mark My Words": "theme-words",
  "Mathematically Speaking": "theme-words",
  "Military Ranks": "theme-words",
  Patchwork: "theme-words",
  "Red, White, or Blue": "theme-words",
  "Saintly Surprises": "theme-words",
  Sheesh: "theme-words",
  "X, Y, or Z": "theme-words",
  "CODE Words": "missing-letters",
  "FINE Words": "missing-letters",
  "FLAG Words": "missing-letters",
  "FORE Words": "missing-letters",
  "KIND Words": "missing-letters",
  "OTHER Words": "missing-letters",
  "What's the Word?": "shared-letters",
  "Letter Play": "shared-letters",
  "Happy Endings": "shared-letters",
  "Animal Idioms": "finish-phrase",
  "Attitudes and Behaviour": "finish-phrase",
  "Autumn Sayings": "finish-phrase",
  "Snowy Sayings": "finish-phrase",
  Colorfill: "finish-phrase",
  "Colour Idioms": "finish-phrase",
  "Number Idioms": "finish-phrase",
  "Criticizing Things": "finish-phrase",
  "Praising Things": "finish-phrase",
  "Praising and Criticizing": "finish-phrase",
  "Don't Be an Idiom": "finish-phrase",
  "Down to the Wire": "finish-phrase",
  "Filled with Emotion": "finish-phrase",
  "Finish the Food Idiom": "finish-phrase",
  "Finish the Proverb": "finish-phrase",
  "Finish the Saying": "finish-phrase",
  "Idioms with ON": "finish-phrase",
  "Jingles & Slogans": "finish-phrase",
  "Missing Numbers": "finish-phrase",
  "What's the Animal?": "finish-phrase",
  "Who the What?": "finish-phrase",
  "Autumn Rhymes": "rhymes",
  "Winter Rhymes": "rhymes",
  "Rebus & Rhymes": "rhymes",
  "Rhyme Time": "rhymes",
  "Rhymin' Geography": "rhymes",
  "Rhyming Words": "rhymes",
  "Stinky Pinky": "rhymes",
  "What a Pair": "pairs",
  "Color Associations": "find-link",
  "Names, Names": "find-link",
  "Odd Man Out": "find-link",
  "What Do They Have in Common?": "find-link",
};

const BY_ID = new Map(GUIDES.map((g) => [g.id, g]));

/** The guide for a task name (after taskName). */
export function taskGuide(task: string): GuideEntry {
  if (/^Letter [A-Z] Trivia$/.test(task)) return BY_ID.get("letter-trivia")!;
  return BY_ID.get(TASK_GUIDE[task] ?? "trivia")!;
}

/**
 * The guide for a clue in a category. A mixed category names each clue's own
 * type up front ("(Hidden Animals) Gi _ _ _ — …"), and that type's guide wins.
 */
export function guideFor(category: string, clue?: string): GuideEntry {
  const own = clue && /^\(([^)]+)\)\s/.exec(clue);
  if (own) {
    const task = taskName(own[1]);
    if (TASK_GUIDE[task] || /^Letter [A-Z] Trivia$/.test(task)) return taskGuide(task);
  }
  return taskGuide(taskName(category));
}

/** Task names per guide id, for the Guides page. */
export function tasksByGuide(names: Iterable<string>): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const n of new Set([...names].map(taskName))) {
    const id = taskGuide(n).id;
    out.set(id, [...(out.get(id) ?? []), n].sort((a, b) => a.localeCompare(b)));
  }
  return out;
}
