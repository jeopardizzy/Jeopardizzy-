import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(join(ROOT, "app", "package.json"));
const { createJiti } = require("jiti");

const jiti = createJiti(join(ROOT, "app", "src") + "/");
const { listPlayableGames, boardForRound, gameRoundCount, materializeGame } = jiti(join(ROOT, "app/src/lib/board.ts"));

const SEED = 20261015;
const out = [];
for (const g of listPlayableGames().filter((x) => !x.daily)) {
  const game = materializeGame(g, SEED);
  const rounds = [];
  for (let r = 0; r < gameRoundCount(game); r++) {
    const b = boardForRound(game, r, SEED);
    rounds.push({
      round: r + 1,
      categories: b.categories.map((c) => c.name),
      tiles: b.tiles.map((t) => ({
        category: t.categoryName, value: t.value, clue: t.clue, answer: t.answer, note: t.note ?? "",
      })),
    });
  }
  out.push({
    id: game.id, name: game.name, series: game.series, level: game.level,
    final: game.final, rounds,
  });
}
writeFileSync(join(ROOT, "tools/docgen/boards.json"), JSON.stringify(out, null, 1));
console.log("games dumped:", out.length, "| rounds:", out.reduce((n, g) => n + g.rounds.length, 0));
