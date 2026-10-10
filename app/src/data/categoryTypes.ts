/**
 * Task-type tags for every dataset category, keyed by category name.
 * Types drive the Workbook (practice by type) and the Guides section.
 */
export type TaskType =
  | "homonyms"
  | "compound"
  | "word-parts"
  | "backwords"
  | "heteronyms"
  | "letter-trivia"
  | "initials"
  | "hidden-word"
  | "title-swap"
  | "geography"
  | "knowledge";

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  homonyms: "Homonyms",
  compound: "Compound Words",
  "word-parts": "Word Parts",
  backwords: "Backwords",
  heteronyms: "Heteronyms",
  "letter-trivia": "Letter Trivia",
  initials: "Initials Quiz",
  "hidden-word": "Hidden Words",
  "title-swap": "Title Swap",
  geography: "Geography",
  knowledge: "General Knowledge",
};

export const CATEGORY_TYPES: Record<string, TaskType> = {
  Homonyms: "homonyms",
  "Homonyms II": "homonyms",
  "Homonyms III": "homonyms",
  "Homonyms IV": "homonyms",
  "Homonyms V": "homonyms",
  "Compound Words": "compound",
  "Compound Words II": "compound",
  "Compound Words III": "compound",
  "Compound Words IV": "compound",
  "Compound Words V": "compound",
  "Compound Words VI": "compound",
  "Word Parts": "word-parts",
  "Word Parts II": "word-parts",
  "Word Sums": "word-parts",
  Backwords: "backwords",
  "Backwords II": "backwords",
  Heteronyms: "heteronyms",
  "Heteronyms II": "heteronyms",
  "Heteronyms III": "heteronyms",
  "Letter A Trivia": "letter-trivia",
  "Letter C Trivia": "letter-trivia",
  "Letter D Trivia": "letter-trivia",
  "Letter I Trivia": "letter-trivia",
  "Letter N Trivia": "letter-trivia",
  "Letter S Trivia": "letter-trivia",
  "Letter U Trivia": "letter-trivia",
  "Letter V Trivia": "letter-trivia",
  "Letter W Trivia": "letter-trivia",
  "Letter X Trivia": "letter-trivia",
  "TP Initials": "initials",
  "R Initials": "initials",
  "A Initials": "initials",
  "I Initials": "initials",
  "P & A Initials": "initials",
  "C & D Initials": "initials",
  "Hidden Body Parts": "hidden-word",
  "Colorful Titles": "title-swap",
  "Colorful Titles II": "title-swap",
  "Body-Part Titles": "title-swap",
  "Body-Part Titles II": "title-swap",
  "Place-Name Titles": "title-swap",
  "Geographical Doubles": "geography",
  Rivers: "geography",
  "World Spots": "geography",
  // everything else is general knowledge trivia
};
