import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * "Jeopardy!" is Sony's trademark: Apple and Google reject store metadata
 * that uses it, so neither the app nor the listings may say it. The internal
 * id "daily-jeopardy" stays (saved progress is keyed on it) but is never shown.
 */
const ROOTS = ["src", "public", "../docs/listing"];
const TEXT = /\.(tsx?|html|txt)$/;
const ALLOWED = /daily-jeopardy|jeopardizzy/gi;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : TEXT.test(p) ? [p] : [];
  });
}

describe("no trademarked game-show name", () => {
  it("app source, web pages and store listings never say Jeopardy", () => {
    const hits = ROOTS.flatMap(files).filter((f) =>
      /jeopardy/i.test(readFileSync(f, "utf8").replace(ALLOWED, "")),
    );
    expect(hits).toEqual([]);
  });
});
