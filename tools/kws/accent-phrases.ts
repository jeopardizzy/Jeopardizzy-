// Prints the accent test set's answers as JSON: [{ phrase, answer }].
// A spread of Workbook answers (every puzzle type, short and long), picked
// deterministically so runs compare.
import { quizData } from "../../app/src/data/quizData";
import { CATEGORY_TYPES } from "../../app/src/data/categoryTypes";
import { spokenTargets } from "../../app/src/lib/spokenTargets";
import tokens from "../../app/src/data/kwsTokens.json";

const T = tokens as Record<string, string>;
const byType = new Map<string, { phrase: string; answer: string }[]>();
for (const c of quizData.categories) {
  const type = CATEGORY_TYPES[c.name] ?? "knowledge";
  for (const q of c.clues) {
    const groups = spokenTargets(q.answer);
    if (groups.length !== 1) continue; // single-item answers; lists are covered by the same engine path
    const phrase = groups[0].find((p) => T[p]);
    if (phrase) (byType.get(type) ?? byType.set(type, []).get(type)!).push({ phrase, answer: q.answer });
  }
}
const out: { phrase: string; answer: string }[] = [];
const seen = new Set<string>();
for (let round = 0; out.length < 40 && round < 50; round++) {
  for (const list of byType.values()) {
    const item = list[(round * 7) % list.length];
    if (item && !seen.has(item.phrase) && out.length < 40) {
      seen.add(item.phrase);
      out.push(item);
    }
  }
}
process.stdout.write(JSON.stringify(out));
