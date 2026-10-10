/** Guide content for each puzzle type. Reused from the original site,
 *  with one new entry (Heteronyms) written for this fork. */
export interface GuideEntry {
  type: string;
  name: string;
  skills: string;
  how: string;
  example: string;
  tips: string[];
}

export const GUIDES: GuideEntry[] = [
  {
    type: "initials",
    name: "Acronym Alphabet",
    skills: "long-term memory, working memory",
    how: "Say what a common acronym stands for.",
    example: "<b>Clue:</b> VIN &nbsp;&nbsp; <b>Answer:</b> <b>Vehicle Identification Number</b>.",
    tips: ["Ask where you have seen it (car, sports page, government, dictionary, vet clinic).", "Map each letter to a likely word from that field.", "Some acronyms have more than one meaning (ERA: earned run average or Equal Rights Amendment). Give both if you know them.", "Use patterns: FLOTUS follows POTUS (President of the United States)."],
  },
  {
    type: "knowledge",
    name: "Nicknames",
    skills: "long-term memory, executive functioning",
    how: "Name the person, place or thing from its nickname.",
    example: "<b>Clue:</b> Old Glory &nbsp;&nbsp; <b>Answer:</b> <b>The American flag</b>.",
    tips: ["Ask what the nickname describes (a look, a shape, a habit).", "Decide the category first: person, place, object.", "Break the nickname into parts: 'Soup Strainer' hints at something worn on the face.", "Some nicknames have more than one answer (The Tube = London Underground or TV)."],
  },
  {
    type: "word-parts",
    name: "Word Parts",
    skills: "long-term memory, working memory, executive functioning",
    how: "You get definitions for the two parts of a word. Put them together (men + ace = menace).",
    example: "<b>Clues:</b> Chum + highest card &nbsp;&nbsp; <b>Answer:</b> <b>pal + ace = palace</b>.",
    tips: ["Solve each part separately and write it down.", "Join the parts in order; try both orders if needed.", "Watch for opposites (opposite of on = off).", "Check that the joined word is real."],
  },
  {
    type: "title-swap",
    name: "Replace the Swamp / Chartreuse Titles",
    skills: "long-term memory, executive functioning",
    how: "A famous title contains a placeholder (SWAMP or CHARTREUSE). Replace it with the correct geographic feature or color.",
    example: "<b>Clue:</b> Treasure SWAMP &nbsp;&nbsp; <b>Answer:</b> <b>Treasure Island</b>.",
    tips: ["Say the title with a likely geographic word (island, lake, river) or color (pink, red).", "Think of the author or film the title belongs to.", "Check the rhythm: titles are fixed in wording.", "Some answers have alternatives (Blue Christmas)."],
  },
  {
    type: "general",
    name: "How to approach any task",
    skills: "long-term memory, working memory, executive functioning",
    how: "Every game in this chapter trains memory and thinking. Read the one-line rule first (the starting letters, the pairing, the blank pattern) and apply it to every item.",
    example: "<b>Example:</b> In “It’s a Kick”, the rule is that every answer starts with K. The clue “A smack or a peck” becomes <b>Kiss</b>.",
    tips: ["Read the rule before the clues, then restate it in your own words.", "Do the easy items first; their letters and patterns often unlock harder ones.", "Say candidates aloud (sound helps with homonyms, letter spellers and compound words).", "Check each answer against every part of the clue, then spelling.", "Keep a “parking lot” of hard clues and return to them."],
  },
  {
    type: "letter-trivia",
    name: "It Starts with a Letter",
    skills: "long-term memory, working memory",
    how: "All of the answers in this game start with a letter, as in X-Ray, I Beam, or V Chip.",
    example: "<b>Clue:</b> Discount store chain formerly known as S. S. Kresge Company. [starts with a letter, e.g. X-Ray] &nbsp;&nbsp; <b>Answer:</b> <b>Kmart</b>. <i>Kmart: a discount store chain, originally the S. S. Kresge Company.</i>",
    tips: ["Expect a single letter plus a word (X-ray, T-bone), often hyphenated.", "Think of brands and abbreviations (U-Haul, J. Crew, H-bomb).", "Match the clue to a famous event or product (D-Day, O-ring)."],
  },
  {
    type: "geography",
    name: "Geographical Double Entendres",
    skills: "long-term memory, working memory, executive functioning",
    how: "This is a word game combined with a trivia game in which you name the geographical place—which is also a word for something entirely different.",
    example: "<b>Clue:</b> An Asian country or . . . ceramic tableware. [a place that is also a word] &nbsp;&nbsp; <b>Answer:</b> <b>China</b>. <i>China: Asian country; china: fine ceramic tableware.</i>",
    tips: ["Each clue has two meanings: find the word that fits both.", "Think of places named after objects or foods (Hamburg, Orange, Canary).", "Test your candidate on both halves."],
  },
  {
    type: "hidden-word",
    name: "Hidden Anatomy",
    skills: "long-term memory, working memory, executive functioning",
    how: "Can you identify the body parts that complete the words in this list? For example, the body part that completes “te _ _ _ raph” is leg (telegraph). For a more strenuous brain exercise, try covering up the definitions and solving the incomplete words without any hints. Notes sung together in a",
    example: "<b>Clue:</b> H _ _ _ ony — Notes sung together in a pleasing combination of sounds. &nbsp;&nbsp; <b>Answer:</b> <b>Harmony</b>. <i>Hidden word: ARM in H[ARM]ony.</i>",
    tips: ["Count the blanks to know the body part’s length (arm=3, chest=5).", "Test short body parts in the gap (arm, eye, toe, hip, ear, rib).", "Read the definition to confirm the whole word."],
  },
  {
    type: "backwords",
    name: "Semordnilaps",
    skills: "executive functioning",
    how: "All the answers in this game are semordnilaps—words that spell a different word forward and backward, such as faced and decaf.",
    example: "<b>Clue:</b> Forward it’s a state of armed conflict; backward it’s uncooked. &nbsp;&nbsp; <b>Answer:</b> <b>War / Raw</b>. <i>War spelled backward is raw. </i>",
    tips: ["Reverse each candidate (stressed = desserts); the word that spells another word is a semordnilap.", "Work from the backward clue: “uncooked” = raw, so the forward word is war.", "The word “semordnilap” is “palindromes” spelled backward."],
  },
  {
    type: "title-swap",
    name: "Replace the Elbow",
    skills: "long-term memory, executive functioning",
    how: "There’s something wrong with these book, story, and movie titles. Can you fix them by replacing the word ELBOW with the correct body part?",
    example: "<b>Clue:</b> Replace ELBOW: A Farewell to ELBOWS by Ernest Hemingway &nbsp;&nbsp; <b>Answer:</b> <b>A Farewell to ARMS</b>. <i>A Farewell to Arms: Hemingway’s World War I novel.</i>",
    tips: ["Read the title aloud with ELBOW and notice what sounds wrong.", "Think of body parts that complete a famous title (Farewell to Arms).", "Try rhymes and sounds: Goldfinger, Scarface, Tom Thumb."],
  },
  {
    type: "heteronyms",
    name: "Heteronyms",
    skills: "language, long-term memory, attention to detail",
    how: "You get two definitions of words that are spelled the SAME but pronounced differently and mean different things. Find the word and give both readings.",
    example: "<b>Clues:</b> to rip ... and a drop from the eye &nbsp;&nbsp; <b>Answer:</b> <b>tear</b> (TAIR / TEER).",
    tips: [
      "Find the spelling that fits both definitions, then work out the two pronunciations.",
      "Stress usually shifts between noun and verb: CONtent (what's inside) vs conTENT (satisfied).",
      "Say the word aloud both ways — the wrong one sounds funny.",
      "Common traps: bass, row, minute, resume, desert, excuse.",
    ],
  },
  {
    type: "homonyms",
    name: "Homonyms",
    skills: "long-term memory, attention to detail, executive functioning",
    how: "You get two definitions. Find the two words that sound the same but differ in meaning and spelling, and spell each correctly. (In this game all pairs are strict homophones.)",
    example: "<b>Clues:</b> a long cry of pain; a marine mammal &nbsp;&nbsp; <b>Answer:</b> <b>wail / whale</b>.",
    tips: ["Solve the easier definition first, then say it aloud and hunt for a sound-alike.", "Check the tricky spellings: silent letters (knows/nose), wh/w (whale/wail), -ai-/-a-e (pray/prey).", "Write both words and check that each matches its own definition, not the other.", "Match every definition to the correct spelling; a spelling error means a wrong answer."],
  },
  {
    type: "compound",
    name: "Double Trouble",
    skills: "working memory, executive functioning",
    how: "You get several words. Find the one word that can follow each of them to make a compound word or a two-word phrase.",
    example: "<b>Clues:</b> knuckle, moth, basket &nbsp;&nbsp; <b>Answer:</b> <b>ball</b> (knuckleball, mothball, basketball).",
    tips: ["Start with the most flexible word and list what can follow it (Holy: water, land, Bible ...).", "Test each candidate against the other words. Cross out fast.", "Don't lock onto one meaning of a word; it may be part of a phrase (cover girl, golden girl).", "Answers can be closed, open or hyphenated compounds.", "Use the first-letter hint only as a last resort."],
  },]
