/** Playtest harness: dump real boards + measure typed-answer friendliness. */
import { quizData } from "../src/data/quizData";
import { generateRound, pickFinal } from "../src/lib/board";
import { isCorrect, normalize } from "../src/lib/answerMatch";
import { dailySeed } from "../src/lib/random";

function typo(s: string): string {
  // delete one character from the middle-ish
  const i = Math.max(1, Math.floor(s.length / 2));
  return s.slice(0, i) + s.slice(i + 1);
}

const hardToType = (a: string) => a.split(" ").length > 4 || a.includes(",");

let r1PassExact = 0, r1PassTypo = 0, r1Total = 0, r1Hard = 0;
let r2PassExact = 0, r2PassTypo = 0, r2Total = 0, r2Hard = 0;

for (const seed of [11, 22, 33, 44]) {
  for (const round of [1, 2] as const) {
    const b = generateRound(quizData, seed, round);
    console.log(`\n=== seed ${seed} ROUND ${round} ===`);
    for (const cat of b.categories) {
      const tiles = b.tiles.filter((t) => t.categoryId === cat.id);
      console.log(`\n## ${cat.name}`);
      for (const t of tiles) {
        const exact = isCorrect(normalize(t.answer), t.answer);
        const ty = isCorrect(typo(normalize(t.answer)), t.answer);
        const hard = hardToType(t.answer);
        if (round === 1) { r1Total++; r1PassExact += +exact; r1PassTypo += +ty; r1Hard += +hard; }
        else { r2Total++; r2PassExact += +exact; r2PassTypo += +ty; r2Hard += +hard; }
        console.log(
          `  [${t.value}] ${t.clue.slice(0, 88)}${t.clue.length > 88 ? "…" : ""}\n` +
          `        -> ${t.answer}${hard ? "  [LONG]" : ""} ${exact ? "" : "  [!!exact-fails]"}`,
        );
      }
    }
  }
  const used = [
    ...generateRound(quizData, seed, 1).categories,
    ...generateRound(quizData, seed, 2).categories,
  ].map((c) => c.id);
  const f = pickFinal(quizData, seed, used);
  console.log(`\n## FINAL (${f.categoryName}): ${f.clue.slice(0, 90)} -> ${f.answer}`);
}

console.log("\n================ MATCHER STATS ================");
console.log(`Round1: exact ${r1PassExact}/${r1Total}, typo ${r1PassTypo}/${r1Total}, long-answer ${r1Hard}/${r1Total}`);
console.log(`Round2: exact ${r2PassExact}/${r2Total}, typo ${r2PassTypo}/${r2Total}, long-answer ${r2Hard}/${r2Total}`);
console.log("dailySeed today:", dailySeed());
