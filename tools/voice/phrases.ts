// Prints every line the quizmaster can say, as JSON, for tools/voice/bake.mjs.
// usage (from the repo root): npx --prefix app tsx tools/voice/phrases.ts > phrases.json
//
// Walks every exported game data module, so new boards are picked up without
// touching this file: any object with string `clue` + `answer` is a clue, and
// any `name` inside a `categories` array is a category.
import * as quizData from "../../app/src/data/quizData";
import * as games from "../../app/src/data/games";
import * as uoe from "../../app/src/data/uoeGames";
import * as legacy from "../../app/src/data/legacyBoards";
import * as arena3 from "../../app/src/data/arena3Boards";
import * as arena4 from "../../app/src/data/arena4Boards";
import * as boardGames from "../../app/src/data/boardGames";
import { HOST_LINES, spokenAnswer, spokenClue, voiceId, type VoiceKind } from "../../app/src/lib/speech";

interface Phrase {
  id: string;
  kind: VoiceKind;
  /** on-screen text the id is derived from */
  text: string;
  /** what is actually sent to the voice */
  say: string;
}

const out = new Map<string, Phrase>();
const add = (kind: VoiceKind, text: string, say: string) => {
  const id = voiceId(kind, text);
  const prev = out.get(id);
  if (prev && prev.text !== text.trim().replace(/\s+/g, " ")) throw new Error(`id collision: ${id}`);
  out.set(id, { id, kind, text: text.trim().replace(/\s+/g, " "), say });
};

const seen = new Set<object>();
function walk(o: unknown): void {
  if (!o || typeof o !== "object" || seen.has(o)) return;
  seen.add(o);
  if (Array.isArray(o)) return o.forEach(walk);
  const r = o as Record<string, unknown>;
  if (typeof r.clue === "string" && typeof r.answer === "string") {
    add("clue", r.clue, spokenClue(r.clue));
    add("answer", r.answer, spokenAnswer(r.answer));
  }
  if (Array.isArray(r.categories)) {
    for (const c of r.categories) {
      const name = (c as { name?: unknown })?.name;
      if (typeof name === "string") add("category", name, name);
    }
  }
  Object.values(r).forEach(walk);
}

[quizData, games, uoe, legacy, arena3, arena4, boardGames].forEach((m) => Object.values(m).forEach(walk));
for (const [key, line] of Object.entries(HOST_LINES)) out.set(`h-${key}`, { id: `h-${key}`, kind: "line", text: line, say: line });

process.stdout.write(JSON.stringify([...out.values()], null, 0));
