import { quizData } from "../src/data/quizData";
for (const c of quizData.categories) {
  const sample = c.clues[Math.floor(c.clues.length / 2)];
  console.log(`${c.id} | t${c.difficulty} | n=${c.clues.length} | ${c.name} || ${sample.clue.slice(0, 60)} -> ${sample.answer.slice(0, 30)}`);
}
