// Prints every phrase the Workbook may listen for, as a JSON array.
// usage (repo root): npx --prefix app tsx tools/kws/phrases.ts > tmp/kws-phrases.json
//
// Covers every answer in the game data, not just the Workbook bank, because
// "Practice these" drills pull clues from the team-game boards too.
import * as quizData from "../../app/src/data/quizData";
import * as games from "../../app/src/data/games";
import * as uoe from "../../app/src/data/uoeGames";
import * as legacy from "../../app/src/data/legacyBoards";
import * as arena3 from "../../app/src/data/arena3Boards";
import * as arena4 from "../../app/src/data/arena4Boards";
import * as seasonal from "../../app/src/data/seasonalBoards";
import * as boardGames from "../../app/src/data/boardGames";
import { allPhrases } from "../../app/src/lib/spokenTargets";

const answers = new Set<string>();
const seen = new Set<object>();
function walk(o: unknown): void {
  if (!o || typeof o !== "object" || seen.has(o)) return;
  seen.add(o);
  if (Array.isArray(o)) return o.forEach(walk);
  const r = o as Record<string, unknown>;
  if (typeof r.clue === "string" && typeof r.answer === "string") answers.add(r.answer);
  Object.values(r).forEach(walk);
}
[quizData, games, uoe, legacy, arena3, arena4, seasonal, boardGames].forEach((m) => Object.values(m).forEach(walk));
process.stdout.write(JSON.stringify(allPhrases([...answers])));
