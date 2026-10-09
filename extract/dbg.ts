import { quizData } from "../src/data/quizData";
import { isCorrect, normalize, alternates } from "../src/lib/answerMatch";
let n = 0;
for (const c of quizData.categories) {
  for (const cl of c.clues) {
    if (!isCorrect(normalize(cl.answer), cl.answer)) {
      if (n++ < 12) console.log(JSON.stringify(cl.answer), "=> norm:", JSON.stringify(normalize(cl.answer)), "| alts:", alternates(cl.answer).slice(0, 6));
    }
  }
}
console.log("total exact-fails:", n);
